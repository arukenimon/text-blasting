import { supabase } from '@/lib/supabase/client'
import { queryOptions } from '@tanstack/react-query'

export type WorkspaceRole = 'owner' | 'admin' | 'member'

export type WorkspaceOption = {
    id: string
    name: string
    slug: string
    role: WorkspaceRole
}

export const roleRank: Record<WorkspaceRole, number> = {
    owner: 3,
    admin: 2,
    member: 1,
}

export function canManageWorkspace(role?: WorkspaceRole | null) {
    return Boolean(role && roleRank[role] >= roleRank.admin)
}

export const getWorkspaceContextOption = (userId?: string | null) =>
    queryOptions({
        queryKey: ['workspace-context', userId],
        enabled: Boolean(userId),
        queryFn: async () => {
            if (!userId) return null

            const [{ data: profile, error: profileError }, { data: memberships, error: membershipsError }] =
                await Promise.all([
                    supabase
                        .from('profile')
                        .select('active_workspace_id')
                        .eq('id', userId)
                        .maybeSingle(),
                    supabase
                        .from('workspace_members')
                        .select('workspace_id, role, workspaces(id, name, slug)')
                        .eq('user_id', userId)
                        .order('joined_at', { ascending: true }),
                ])

            if (profileError) throw new Error(profileError.message)
            if (membershipsError) throw new Error(membershipsError.message)

            const workspaces: WorkspaceOption[] = (memberships ?? []).flatMap((membership) => {
                const workspace = Array.isArray(membership.workspaces)
                    ? membership.workspaces[0]
                    : membership.workspaces
                if (!workspace) return []
                return [{
                    id: workspace.id,
                    name: workspace.name,
                    slug: workspace.slug,
                    role: membership.role as WorkspaceRole,
                }]
            })

            const activeWorkspace =
                workspaces.find((workspace) => workspace.id === profile?.active_workspace_id) ??
                workspaces[0] ??
                null

            return {
                profile,
                workspaces,
                activeWorkspace,
                activeRole: activeWorkspace?.role ?? null,
            }
        },
    })

export const getWorkspaceGatewayOption = (workspaceId?: string | null) =>
    queryOptions({
        queryKey: ['workspace-gateway', workspaceId],
        enabled: Boolean(workspaceId),
        queryFn: async () => {
            const { data, error } = await supabase
                .from('workspace_sms_gateway')
                .select('cloud_server, sim_slot, webhook_token, webhook_registrations')
                .eq('workspace_id', workspaceId)
                .maybeSingle()
            if (error) throw new Error(error.message)
            return data ?? null
        },
    })

export const getWorkspaceTeamOption = (workspaceId?: string | null) =>
    queryOptions({
        queryKey: ['workspace-team', workspaceId],
        enabled: Boolean(workspaceId),
        queryFn: async () => {
            const [{ data: members, error: membersError }, { data: invitations, error: invitationsError }] =
                await Promise.all([
                    supabase
                        .from('workspace_members')
                        .select('workspace_id, user_id, user_email, role, joined_at')
                        .eq('workspace_id', workspaceId)
                        .order('joined_at', { ascending: true }),
                    supabase
                        .from('workspace_invitations')
                        .select('id, email, role, status, expires_at, created_at')
                        .eq('workspace_id', workspaceId)
                        .order('created_at', { ascending: false }),
                ])

            if (membersError) throw new Error(membersError.message)
            if (invitationsError) throw new Error(invitationsError.message)
            return { members: members ?? [], invitations: invitations ?? [] }
        },
    })
