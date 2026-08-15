'use server'

import { headers } from 'next/headers'
import { createAuthEmailClient } from '@/lib/supabase/email-auth'
import { createAdminClient } from '@/lib/supabase/server'
import {
    getCurrentUserId,
    hasRoleAtLeast,
    requireWorkspaceRole,
    switchActiveWorkspaceForUser,
    type WorkspaceRole,
} from '@/lib/workspaces/server'

type ActionResult = {
    success: boolean
    error?: string
}

type FormActionResult = {
    success: boolean
    errors: Record<string, string[]>
}

type WorkspaceInvitation = {
    id: string
    workspace_id: string
    email: string
    role: string
    status: string
    expires_at: string
    token?: string
}

const INVITABLE_ROLES: WorkspaceRole[] = ['admin', 'member']

function normalizeEmail(email: string) {
    return email.trim().toLowerCase()
}

function isConfirmedAuthUser(user: { email_confirmed_at?: string | null; confirmed_at?: string | null } | null) {
    return Boolean(user?.email_confirmed_at || user?.confirmed_at)
}

function buildAbsoluteUrl(origin: string, path: string) {
    return `${origin}${path.startsWith('/') ? path : `/${path}`}`
}

function inviteUserMetadata(token: string, workspaceId: string, role: WorkspaceRole) {
    return {
        workspace_invite_token: token,
        workspace_id: workspaceId,
        workspace_role: role,
    }
}

async function getOrigin() {
    const hdrs = await headers()
    return (
        process.env.NEXT_PUBLIC_SITE_URL ??
        process.env.WEBHOOK_BASE_URL ??
        hdrs.get('origin') ??
        (hdrs.get('host') ? `${hdrs.get('x-forwarded-proto') ?? 'https'}://${hdrs.get('host')}` : '')
    ).replace(/\/+$/, '')
}

async function findAuthUserByEmail(email: string) {
    const admin = createAdminClient()
    let page = 1
    const perPage = 1000

    while (page <= 10) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
        if (error) throw error

        const match = data.users.find((user) => user.email?.toLowerCase() === email)
        if (match) return match
        if (data.users.length < perPage) return null
        page += 1
    }

    return null
}

async function updateUserInviteMetadata(
    admin: ReturnType<typeof createAdminClient>,
    user: { id: string; user_metadata?: Record<string, unknown> | null },
    token: string,
    workspaceId: string,
    role: WorkspaceRole
) {
    const { error } = await admin.auth.admin.updateUserById(user.id, {
        user_metadata: {
            ...(user.user_metadata ?? {}),
            ...inviteUserMetadata(token, workspaceId, role),
        },
    })
    if (error) throw error
}

async function clearUserInviteMetadata(
    admin: ReturnType<typeof createAdminClient>,
    userId: string,
    acceptedToken?: string
) {
    const { data: userData } = await admin.auth.admin.getUserById(userId)
    const nextMetadata = { ...(userData.user?.user_metadata ?? {}) }
    if (acceptedToken && nextMetadata.workspace_invite_token !== acceptedToken) return

    delete nextMetadata.workspace_invite_token
    delete nextMetadata.workspace_id
    delete nextMetadata.workspace_role

    await admin.auth.admin.updateUserById(userId, {
        user_metadata: nextMetadata,
    })
}

async function findExistingWorkspaceMemberByEmail(
    admin: ReturnType<typeof createAdminClient>,
    workspaceId: string,
    email: string
) {
    const { data: members, error } = await admin
        .from('workspace_members')
        .select('user_id, user_email')
        .eq('workspace_id', workspaceId)

    if (error) throw error

    const existingByEmail = (members ?? []).find((member) => normalizeEmail(member.user_email ?? '') === email)
    if (existingByEmail) return existingByEmail

    const authUser = await findAuthUserByEmail(email)
    if (!authUser) return null

    return (members ?? []).find((member) => member.user_id === authUser.id) ?? null
}

async function sendWorkspaceInviteEmail({
    email,
    role,
    token,
    workspaceId,
}: {
    email: string
    role: WorkspaceRole
    token: string
    workspaceId: string
}) {
    const origin = await getOrigin()
    const acceptRedirectTo = buildAbsoluteUrl(origin, `/invite/accept?token=${token}`)
    const completeRedirectTo = buildAbsoluteUrl(origin, `/invite/complete?token=${token}`)
    const existingUser = await findAuthUserByEmail(email)
    const admin = createAdminClient()

    if (existingUser && isConfirmedAuthUser(existingUser)) {
        await updateUserInviteMetadata(admin, existingUser, token, workspaceId, role)

        const authClient = createAuthEmailClient()
        const { error } = await authClient.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: acceptRedirectTo,
                shouldCreateUser: false,
            },
        })
        if (error) throw error
        return
    }

    if (existingUser) {
        await updateUserInviteMetadata(admin, existingUser, token, workspaceId, role)

        const authClient = createAuthEmailClient()
        const { error } = await authClient.auth.resend({
            type: 'signup',
            email,
            options: {
                emailRedirectTo: completeRedirectTo,
            },
        })
        if (error) throw error
        return
    }

    const { error } = await admin.auth.admin.inviteUserByEmail(email, {
        redirectTo: completeRedirectTo,
        data: inviteUserMetadata(token, workspaceId, role),
    })
    if (error) throw error
}

export async function switch_workspace(workspaceId: string): Promise<ActionResult> {
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: 'Not authenticated' }

    try {
        await switchActiveWorkspaceForUser(userId, workspaceId)
        return { success: true }
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Failed to switch workspace' }
    }
}

export async function invite_workspace_member(
    _prevState: unknown,
    formData: FormData
): Promise<FormActionResult> {
    let context
    try {
        context = await requireWorkspaceRole('admin')
    } catch (err) {
        return { success: false, errors: { form: [err instanceof Error ? err.message : 'Not authorized.'] } }
    }

    const email = normalizeEmail(String(formData.get('email') ?? ''))
    const role = String(formData.get('role') ?? 'member') as WorkspaceRole

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { success: false, errors: { email: ['Enter a valid email address.'] } }
    }
    if (!INVITABLE_ROLES.includes(role)) {
        return { success: false, errors: { role: ['Invite role must be admin or member.'] } }
    }

    const admin = createAdminClient()
    try {
        const existingMember = await findExistingWorkspaceMemberByEmail(admin, context.workspace.id, email)
        if (existingMember) {
            return { success: false, errors: { form: ['This user is already a member of this workspace.'] } }
        }
    } catch (err) {
        return {
            success: false,
            errors: { form: [err instanceof Error ? err.message : 'Failed to check workspace membership.'] },
        }
    }

    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data: existingInvite } = await admin
        .from('workspace_invitations')
        .select('id')
        .eq('workspace_id', context.workspace.id)
        .eq('email', email)
        .eq('status', 'pending')
        .maybeSingle()

    const invitePayload = {
        workspace_id: context.workspace.id,
        email,
        role,
        token,
        status: 'pending',
        expires_at: expiresAt,
        invited_by: context.userId,
        accepted_by: null,
        accepted_at: null,
    }

    const { error: inviteErr } = existingInvite
        ? await admin
            .from('workspace_invitations')
            .update(invitePayload)
            .eq('id', existingInvite.id)
        : await admin
            .from('workspace_invitations')
            .insert(invitePayload)

    if (inviteErr) {
        return { success: false, errors: { form: [inviteErr.message] } }
    }

    try {
        await sendWorkspaceInviteEmail({
            email,
            role,
            token,
            workspaceId: context.workspace.id,
        })
    } catch (err) {
        await admin
            .from('workspace_invitations')
            .update({ status: 'revoked' })
            .eq('token', token)
        return {
            success: false,
            errors: { form: [err instanceof Error ? err.message : 'Failed to send invite email.'] },
        }
    }

    return { success: true, errors: {} }
}

export async function resend_workspace_invitation(invitationId: string): Promise<ActionResult> {
    let context
    try {
        context = await requireWorkspaceRole('admin')
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Not authorized.' }
    }

    const admin = createAdminClient()
    const { data: invite, error: inviteErr } = await admin
        .from('workspace_invitations')
        .select('id, workspace_id, email, role, token, status, expires_at')
        .eq('id', invitationId)
        .eq('workspace_id', context.workspace.id)
        .maybeSingle()

    if (inviteErr || !invite) {
        return { success: false, error: 'Invitation not found.' }
    }
    if (invite.status !== 'pending') {
        return { success: false, error: 'Only pending invitations can be resent.' }
    }

    try {
        const existingMember = await findExistingWorkspaceMemberByEmail(
            admin,
            context.workspace.id,
            normalizeEmail(invite.email)
        )
        if (existingMember) {
            await admin
                .from('workspace_invitations')
                .update({ status: 'revoked' })
                .eq('id', invite.id)
                .eq('status', 'pending')

            return { success: false, error: 'This user is already a member of this workspace.' }
        }
    } catch (err) {
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Failed to check workspace membership.',
        }
    }

    const expiresAt =
        new Date(invite.expires_at).getTime() < Date.now()
            ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            : invite.expires_at

    if (expiresAt !== invite.expires_at) {
        const { error: updateErr } = await admin
            .from('workspace_invitations')
            .update({ expires_at: expiresAt, invited_by: context.userId })
            .eq('id', invite.id)
        if (updateErr) return { success: false, error: updateErr.message }
    }

    try {
        await sendWorkspaceInviteEmail({
            email: normalizeEmail(invite.email),
            role: invite.role as WorkspaceRole,
            token: invite.token,
            workspaceId: invite.workspace_id,
        })
    } catch (err) {
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Failed to resend invite email.',
        }
    }

    return { success: true }
}

export async function cancel_workspace_invitation(invitationId: string): Promise<ActionResult> {
    let context
    try {
        context = await requireWorkspaceRole('admin')
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Not authorized.' }
    }

    const admin = createAdminClient()
    const { data: invite, error: inviteErr } = await admin
        .from('workspace_invitations')
        .select('id, status')
        .eq('id', invitationId)
        .eq('workspace_id', context.workspace.id)
        .maybeSingle()

    if (inviteErr || !invite) {
        return { success: false, error: 'Invitation not found.' }
    }
    if (invite.status !== 'pending') {
        return { success: false, error: 'Only pending invitations can be cancelled.' }
    }

    const { data: cancelledInvite, error: updateErr } = await admin
        .from('workspace_invitations')
        .update({ status: 'revoked' })
        .eq('id', invite.id)
        .eq('status', 'pending')
        .select('id')
        .maybeSingle()

    if (updateErr) return { success: false, error: updateErr.message }
    if (!cancelledInvite) return { success: false, error: 'This invitation is no longer pending.' }

    return { success: true }
}

export async function remove_workspace_member(memberUserId: string): Promise<ActionResult> {
    let context
    try {
        context = await requireWorkspaceRole('owner')
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Not authorized.' }
    }

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(memberUserId)) {
        return { success: false, error: 'Invalid workspace member.' }
    }
    if (memberUserId === context.userId) {
        return { success: false, error: 'The workspace owner cannot be removed.' }
    }

    const admin = createAdminClient()
    const { data: membership, error: membershipError } = await admin
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', context.workspace.id)
        .eq('user_id', memberUserId)
        .maybeSingle()

    if (membershipError || !membership) {
        return { success: false, error: 'Workspace member not found.' }
    }
    if (membership.role === 'owner') {
        return { success: false, error: 'Workspace owners cannot be removed.' }
    }

    const { data: removedMembership, error: removeError } = await admin
        .from('workspace_members')
        .delete()
        .eq('workspace_id', context.workspace.id)
        .eq('user_id', memberUserId)
        .neq('role', 'owner')
        .select('user_id')
        .maybeSingle()

    if (removeError || !removedMembership) {
        return { success: false, error: removeError?.message ?? 'Failed to remove workspace member.' }
    }

    const { data: remainingMembership } = await admin
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', memberUserId)
        .order('joined_at', { ascending: true })
        .limit(1)
        .maybeSingle()

    await admin
        .from('profile')
        .update({ active_workspace_id: remainingMembership?.workspace_id ?? null })
        .eq('id', memberUserId)
        .eq('active_workspace_id', context.workspace.id)

    return { success: true }
}

export async function update_workspace_member_role(
    memberUserId: string,
    role: WorkspaceRole
): Promise<ActionResult> {
    let context
    try {
        context = await requireWorkspaceRole('owner')
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Not authorized.' }
    }

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(memberUserId)) {
        return { success: false, error: 'Invalid workspace member.' }
    }
    if (!INVITABLE_ROLES.includes(role)) {
        return { success: false, error: 'Role must be admin or member.' }
    }

    const admin = createAdminClient()
    const { data: membership, error: membershipError } = await admin
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', context.workspace.id)
        .eq('user_id', memberUserId)
        .maybeSingle()

    if (membershipError || !membership) {
        return { success: false, error: 'Workspace member not found.' }
    }
    if (membership.role === 'owner') {
        return { success: false, error: 'Workspace owners cannot be changed.' }
    }
    if (membership.role === role) {
        return { success: true }
    }

    const { data: updatedMembership, error: updateError } = await admin
        .from('workspace_members')
        .update({ role })
        .eq('workspace_id', context.workspace.id)
        .eq('user_id', memberUserId)
        .neq('role', 'owner')
        .select('user_id')
        .maybeSingle()

    if (updateError || !updatedMembership) {
        return { success: false, error: updateError?.message ?? 'Failed to update workspace member role.' }
    }

    return { success: true }
}

async function getPendingInvitationForUser(
    admin: ReturnType<typeof createAdminClient>,
    token: string,
    userId: string
): Promise<{ invite: WorkspaceInvitation; userEmail: string } | { error: string }> {
    if (!token) return { error: 'Invitation token is missing.' }

    const { data: userData, error: userErr } = await admin.auth.admin.getUserById(userId)
    if (userErr || !userData.user) {
        return { error: userErr?.message ?? 'Your account could not be loaded.' }
    }

    const userEmail = normalizeEmail(userData.user.email ?? '')
    if (!userEmail) return { error: 'Your account does not have an email address.' }

    const { data: invite, error: inviteErr } = await admin
        .from('workspace_invitations')
        .select('id, workspace_id, email, role, status, expires_at')
        .eq('token', token)
        .maybeSingle()

    if (inviteErr || !invite) {
        return { error: 'Invitation not found.' }
    }
    if (invite.status !== 'pending') {
        return { error: 'This invitation is no longer pending.' }
    }
    if (new Date(invite.expires_at).getTime() < Date.now()) {
        await admin.from('workspace_invitations').update({ status: 'expired' }).eq('id', invite.id)
        return { error: 'This invitation has expired.' }
    }
    if (normalizeEmail(invite.email) !== userEmail) {
        return { error: 'This invitation was sent to a different email address.' }
    }

    return { invite: invite as WorkspaceInvitation, userEmail }
}

async function joinWorkspaceFromInvitation(
    admin: ReturnType<typeof createAdminClient>,
    invite: WorkspaceInvitation,
    userId: string,
    userEmail: string
): Promise<ActionResult> {
    const { data: existingMembership } = await admin
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', invite.workspace_id)
        .eq('user_id', userId)
        .maybeSingle()

    const existingRole = existingMembership?.role as WorkspaceRole | undefined
    const acceptedRole =
        existingRole && hasRoleAtLeast(existingRole, invite.role as WorkspaceRole)
            ? existingRole
            : invite.role

    const { error: memberErr } = await admin.from('workspace_members').upsert({
        workspace_id: invite.workspace_id,
        user_id: userId,
        user_email: userEmail,
        role: acceptedRole,
    })
    if (memberErr) return { success: false, error: memberErr.message }

    const { error: inviteErr } = await admin
        .from('workspace_invitations')
        .update({
            status: 'accepted',
            accepted_by: userId,
            accepted_at: new Date().toISOString(),
        })
        .eq('id', invite.id)

    if (inviteErr) return { success: false, error: inviteErr.message }

    await clearUserInviteMetadata(admin, userId, invite.token)
    await switchActiveWorkspaceForUser(userId, invite.workspace_id)
    return { success: true }
}

export async function accept_workspace_invitation(token: string): Promise<ActionResult> {
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: 'Sign in to accept this invitation.' }

    const admin = createAdminClient()
    const result = await getPendingInvitationForUser(admin, token, userId)
    if ('error' in result) return { success: false, error: result.error }

    return joinWorkspaceFromInvitation(admin, result.invite, userId, result.userEmail)
}

export async function complete_workspace_invitation(
    _prevState: unknown,
    formData: FormData
): Promise<FormActionResult> {
    const token = String(formData.get('token') ?? '')
    const fullName = String(formData.get('full_name') ?? '').trim()
    const password = String(formData.get('password') ?? '')
    const confirmPassword = String(formData.get('confirm_password') ?? '')

    if (fullName.length < 2) {
        return { success: false, errors: { full_name: ['Enter your name.'] } }
    }
    if (password.length < 8) {
        return { success: false, errors: { password: ['Password must be at least 8 characters.'] } }
    }
    if (password !== confirmPassword) {
        return { success: false, errors: { confirm_password: ['Passwords do not match.'] } }
    }

    const userId = await getCurrentUserId()
    if (!userId) {
        return { success: false, errors: { form: ['Open the invitation link again to finish setting up your account.'] } }
    }

    const admin = createAdminClient()
    const pending = await getPendingInvitationForUser(admin, token, userId)
    if ('error' in pending) {
        return { success: false, errors: { form: [pending.error] } }
    }

    const { data: userData } = await admin.auth.admin.getUserById(userId)
    const userMetadata = {
        ...(userData.user?.user_metadata ?? {}),
        full_name: fullName,
    }

    const { error: updateErr } = await admin.auth.admin.updateUserById(userId, {
        password,
        user_metadata: userMetadata,
    })
    if (updateErr) {
        return { success: false, errors: { form: [updateErr.message] } }
    }

    const joined = await joinWorkspaceFromInvitation(admin, pending.invite, userId, pending.userEmail)
    if (!joined.success) {
        return { success: false, errors: { form: [joined.error ?? 'Failed to accept invitation.'] } }
    }

    return { success: true, errors: {} }
}
