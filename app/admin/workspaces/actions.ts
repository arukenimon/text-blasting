'use server'

import { headers } from 'next/headers'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
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

const INVITABLE_ROLES: WorkspaceRole[] = ['admin', 'member']

function normalizeEmail(email: string) {
    return email.trim().toLowerCase()
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

function createAuthEmailClient() {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
                detectSessionInUrl: false,
            },
        }
    )
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
): Promise<{ success: boolean; errors: Record<string, string[]> }> {
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

    const origin = await getOrigin()
    const next = `/invite/accept?token=${token}`
    const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`

    try {
        const existingUser = await findAuthUserByEmail(email)
        if (existingUser?.email_confirmed_at || existingUser?.confirmed_at) {
            const authClient = createAuthEmailClient()
            const { error } = await authClient.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: redirectTo,
                    shouldCreateUser: false,
                },
            })
            if (error) throw error
        } else {
            const { error } = await admin.auth.admin.inviteUserByEmail(email, {
                redirectTo,
                data: {
                    workspace_invite_token: token,
                    workspace_id: context.workspace.id,
                    workspace_role: role,
                },
            })
            if (error) throw error
        }
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

export async function accept_workspace_invitation(token: string): Promise<ActionResult> {
    const userId = await getCurrentUserId()
    if (!userId) return { success: false, error: 'Sign in to accept this invitation.' }

    const admin = createAdminClient()
    const { data: userData } = await admin.auth.admin.getUserById(userId)
    const userEmail = normalizeEmail(userData.user?.email ?? '')
    if (!userEmail) return { success: false, error: 'Your account does not have an email address.' }

    const { data: invite, error: inviteErr } = await admin
        .from('workspace_invitations')
        .select('id, workspace_id, email, role, status, expires_at')
        .eq('token', token)
        .maybeSingle()

    if (inviteErr || !invite) {
        return { success: false, error: 'Invitation not found.' }
    }
    if (invite.status !== 'pending') {
        return { success: false, error: 'This invitation is no longer pending.' }
    }
    if (new Date(invite.expires_at).getTime() < Date.now()) {
        await admin.from('workspace_invitations').update({ status: 'expired' }).eq('id', invite.id)
        return { success: false, error: 'This invitation has expired.' }
    }
    if (normalizeEmail(invite.email) !== userEmail) {
        return { success: false, error: 'This invitation was sent to a different email address.' }
    }

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

    await admin
        .from('workspace_invitations')
        .update({
            status: 'accepted',
            accepted_by: userId,
            accepted_at: new Date().toISOString(),
        })
        .eq('id', invite.id)

    await switchActiveWorkspaceForUser(userId, invite.workspace_id)
    return { success: true }
}
