import { createAdminClient, createClient } from '@/lib/supabase/server'

export type WorkspaceRole = 'owner' | 'admin' | 'member'

export type WorkspaceSummary = {
    id: string
    name: string
    slug: string
}

export type WorkspaceMembership = {
    workspace_id: string
    user_id: string
    user_email: string | null
    role: WorkspaceRole
    workspaces: WorkspaceSummary | WorkspaceSummary[] | null
}

export type WorkspaceContext = {
    userId: string
    workspace: WorkspaceSummary
    role: WorkspaceRole
    memberships: WorkspaceMembership[]
}

const ROLE_RANK: Record<WorkspaceRole, number> = {
    owner: 3,
    admin: 2,
    member: 1,
}

export class WorkspaceAccessError extends Error {
    constructor(message: string, public status = 403) {
        super(message)
        this.name = 'WorkspaceAccessError'
    }
}

export function hasRoleAtLeast(role: WorkspaceRole, minimum: WorkspaceRole) {
    return ROLE_RANK[role] >= ROLE_RANK[minimum]
}

export async function getCurrentUserId(): Promise<string | null> {
    const session = await createClient()
    const { data: { user } } = await session.auth.getUser()
    return user?.id ?? null
}

async function getUserEmail(userId: string): Promise<string | null> {
    const admin = createAdminClient()
    const { data } = await admin.auth.admin.getUserById(userId)
    return data.user?.email ?? null
}

async function ensurePersonalWorkspaceForUser(userId: string): Promise<string> {
    const admin = createAdminClient()
    const userEmail = await getUserEmail(userId)
    const slug = `personal-${userId.slice(0, 8)}`

    const { data: existing } = await admin
        .from('workspaces')
        .select('id')
        .eq('slug', slug)
        .maybeSingle()

    let workspaceId = existing?.id as string | undefined

    if (!workspaceId) {
        const nameBase = userEmail?.split('@')[0] || 'Personal'
        const { data: created, error } = await admin
            .from('workspaces')
            .insert({
                name: `${nameBase} Workspace`,
                slug,
                created_by: userId,
            })
            .select('id')
            .single()

        if (error || !created) {
            throw new WorkspaceAccessError(error?.message ?? 'Failed to create workspace', 500)
        }
        workspaceId = created.id
    }

    if (!workspaceId) {
        throw new WorkspaceAccessError('Failed to resolve workspace', 500)
    }

    await admin.from('workspace_members').upsert({
        workspace_id: workspaceId,
        user_id: userId,
        user_email: userEmail,
        role: 'owner',
    })
    await admin.from('workspace_sms_gateway').upsert({ workspace_id: workspaceId })
    await admin
        .from('profile')
        .upsert({ id: userId, active_workspace_id: workspaceId }, { onConflict: 'id' })

    return workspaceId
}

export async function getWorkspaceContextForUser(userId: string): Promise<WorkspaceContext> {
    const admin = createAdminClient()

    const { data: profile } = await admin
        .from('profile')
        .select('active_workspace_id')
        .eq('id', userId)
        .maybeSingle()

    const { data: membershipsRaw, error: membershipsErr } = await admin
        .from('workspace_members')
        .select('workspace_id, user_id, user_email, role, workspaces(id, name, slug)')
        .eq('user_id', userId)
        .order('joined_at', { ascending: true })

    if (membershipsErr) {
        throw new WorkspaceAccessError(membershipsErr.message, 500)
    }

    let memberships = (membershipsRaw ?? []) as WorkspaceMembership[]
    if (memberships.length === 0) {
        await ensurePersonalWorkspaceForUser(userId)
        const { data: reloaded, error: reloadErr } = await admin
            .from('workspace_members')
            .select('workspace_id, user_id, user_email, role, workspaces(id, name, slug)')
            .eq('user_id', userId)
            .order('joined_at', { ascending: true })

        if (reloadErr || !reloaded?.length) {
            throw new WorkspaceAccessError(reloadErr?.message ?? 'No workspace membership found', 500)
        }
        memberships = reloaded as WorkspaceMembership[]
    }

    const activeWorkspaceId =
        memberships.find((m) => m.workspace_id === profile?.active_workspace_id)?.workspace_id ??
        memberships[0].workspace_id

    if (activeWorkspaceId !== profile?.active_workspace_id) {
        await admin
            .from('profile')
            .upsert({ id: userId, active_workspace_id: activeWorkspaceId }, { onConflict: 'id' })
    }

    const active = memberships.find((m) => m.workspace_id === activeWorkspaceId) ?? memberships[0]
    const workspace = Array.isArray(active.workspaces) ? active.workspaces[0] : active.workspaces
    if (!workspace) {
        throw new WorkspaceAccessError('Active workspace not found', 404)
    }

    return {
        userId,
        workspace,
        role: active.role,
        memberships,
    }
}

export async function requireWorkspaceRole(
    minimumRole: WorkspaceRole = 'member'
): Promise<WorkspaceContext> {
    const userId = await getCurrentUserId()
    if (!userId) {
        throw new WorkspaceAccessError('Not authenticated', 401)
    }

    const context = await getWorkspaceContextForUser(userId)
    if (!hasRoleAtLeast(context.role, minimumRole)) {
        throw new WorkspaceAccessError('You do not have permission for this workspace.', 403)
    }
    return context
}

export async function switchActiveWorkspaceForUser(userId: string, workspaceId: string) {
    const admin = createAdminClient()
    const { data: membership } = await admin
        .from('workspace_members')
        .select('workspace_id')
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)
        .maybeSingle()

    if (!membership) {
        throw new WorkspaceAccessError('Workspace not found for this user.', 404)
    }

    const { error } = await admin
        .from('profile')
        .upsert({ id: userId, active_workspace_id: workspaceId }, { onConflict: 'id' })

    if (error) {
        throw new WorkspaceAccessError(error.message, 500)
    }
}
