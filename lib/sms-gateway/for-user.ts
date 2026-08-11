import { createAdminClient } from '@/lib/supabase/server'
import { getWorkspaceContextForUser } from '@/lib/workspaces/server'
import { SmsGatewayClient } from './client'
import type { GatewayCredentials } from './types'

export type WorkspaceGatewayProfile = {
    workspace_id: string
    mode: 'cloud'
    sim_slot: number | null
    webhook_token: string
    webhook_secret: string
    cloud_server: { server_address?: string; username?: string; password?: string } | null
    webhook_registrations: Record<string, string>
}

export class GatewayNotConfiguredError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'GatewayNotConfiguredError'
    }
}

export async function loadGatewayProfile(workspaceId: string): Promise<WorkspaceGatewayProfile> {
    const admin = createAdminClient()
    const { data, error } = await admin
        .from('workspace_sms_gateway')
        .select('workspace_id, sim_slot, webhook_token, webhook_secret, cloud_server, webhook_registrations')
        .eq('workspace_id', workspaceId)
        .single()

    if (error || !data) {
        throw new GatewayNotConfiguredError(
            'No workspace gateway found. Save SMS gateway credentials in Settings first.'
        )
    }

    return {
        workspace_id: data.workspace_id,
        mode: 'cloud',
        sim_slot: data.sim_slot ?? null,
        webhook_token: data.webhook_token,
        webhook_secret: data.webhook_secret,
        cloud_server: data.cloud_server ?? null,
        webhook_registrations: (data.webhook_registrations ?? {}) as Record<string, string>,
    }
}

export function credentialsFromProfile(profile: WorkspaceGatewayProfile): GatewayCredentials {
    const cs = profile.cloud_server
    if (!cs?.username || !cs?.password) {
        throw new GatewayNotConfiguredError('Cloud credentials are missing. Update Settings -> SMS.')
    }
    return {
        mode: 'cloud',
        address: cs.server_address ?? 'api.sms-gate.app:443',
        username: cs.username,
        password: cs.password,
    }
}

export async function getGatewayClientForWorkspace(workspaceId: string) {
    const profile = await loadGatewayProfile(workspaceId)
    const creds = credentialsFromProfile(profile)
    return { profile, client: new SmsGatewayClient(creds) }
}

export async function getGatewayClientForUser(userId: string) {
    const context = await getWorkspaceContextForUser(userId)
    return getGatewayClientForWorkspace(context.workspace.id)
}

export function buildWebhookUrl(origin: string, token: string): string {
    return `${origin.replace(/\/+$/, '')}/api/webhooks/${token}`
}
