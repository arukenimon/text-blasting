import { createAdminClient } from '@/lib/supabase/server'
import { SmsGatewayClient } from './client'
import type { GatewayCredentials, GatewayMode } from './types'

export type UserGatewayProfile = {
    user_id: string
    mode: GatewayMode
    sim_slot: number | null
    webhook_token: string
    webhook_secret: string
    local_server: { local_address?: string; public_address?: string; username?: string; password?: string } | null
    cloud_server: { server_address?: string; username?: string; password?: string } | null
    webhook_registrations: Record<string, string>
}

export class GatewayNotConfiguredError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'GatewayNotConfiguredError'
    }
}

export async function loadGatewayProfile(userId: string): Promise<UserGatewayProfile> {
    const admin = createAdminClient()
    const { data, error } = await admin
        .from('profile')
        .select('id, mode, sim_slot, webhook_token, webhook_secret, local_server, cloud_server, webhook_registrations')
        .eq('id', userId)
        .single()

    if (error || !data) {
        throw new GatewayNotConfiguredError(
            'No profile found. Save your SMS gateway credentials in Settings first.'
        )
    }

    return {
        user_id: data.id,
        mode: (data.mode ?? 'cloud') as GatewayMode,
        sim_slot: data.sim_slot ?? null,
        webhook_token: data.webhook_token,
        webhook_secret: data.webhook_secret,
        local_server: data.local_server ?? null,
        cloud_server: data.cloud_server ?? null,
        webhook_registrations: (data.webhook_registrations ?? {}) as Record<string, string>,
    }
}

export function credentialsFromProfile(profile: UserGatewayProfile): GatewayCredentials {
    if (profile.mode === 'cloud') {
        const cs = profile.cloud_server
        if (!cs?.username || !cs?.password) {
            throw new GatewayNotConfiguredError('Cloud credentials are missing. Update Settings → SMS.')
        }
        return {
            mode: 'cloud',
            address: cs.server_address ?? 'api.sms-gate.app:443',
            username: cs.username,
            password: cs.password,
        }
    }
    const ls = profile.local_server
    if (!ls?.username || !ls?.password) {
        throw new GatewayNotConfiguredError('Local credentials are missing. Update Settings → SMS.')
    }
    const address = ls.public_address?.trim() || ls.local_address?.trim()
    if (!address) {
        throw new GatewayNotConfiguredError(
            'Local mode needs a public address reachable from the server. Set it in Settings → SMS.'
        )
    }
    return { mode: 'local', address, username: ls.username, password: ls.password }
}

export async function getGatewayClientForUser(userId: string) {
    const profile = await loadGatewayProfile(userId)
    const creds = credentialsFromProfile(profile)
    return { profile, client: new SmsGatewayClient(creds) }
}

export function buildWebhookUrl(origin: string, token: string): string {
    return `${origin.replace(/\/+$/, '')}/api/webhooks/${token}`
}
