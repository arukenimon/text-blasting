'use server'

import { createAdminClient, createClient } from '@/lib/supabase/server'
import { PasswordSchema, SmsGatewaySchema } from './schema'
import {
    ALL_WEBHOOK_EVENTS,
    LOCAL_SUPPORTED_EVENTS,
    SmsGatewayClient,
    buildWebhookUrl,
    credentialsFromProfile,
    loadGatewayProfile,
    sleep,
} from '@/lib/sms-gateway'
import { headers } from 'next/headers'

type ActionResult = {
    success: boolean
    errors: Record<string, string[]>
    webhookSecretSaved?: boolean
}

async function getCurrentUserId(): Promise<string | null> {
    const sessionClient = await createClient()
    const { data: { user } } = await sessionClient.auth.getUser()
    return user?.id ?? null
}

export async function update_password(_prev: unknown, formData: FormData): Promise<ActionResult> {
    const supabase = createAdminClient()

    const validated = PasswordSchema.safeParse({
        password: formData.get('password'),
        confirm_password: formData.get('confirm_password'),
    })

    if (!validated.success) {
        return { success: false, errors: validated.error.flatten().fieldErrors as Record<string, string[]> }
    }
    if (validated.data.password !== validated.data.confirm_password) {
        return { success: false, errors: { confirm_password: ['Passwords do not match.'] } }
    }

    const userId = await getCurrentUserId()
    if (!userId) return { success: false, errors: { _: ['Not authenticated.'] } }

    const { error } = await supabase.auth.admin.updateUserById(userId, {
        password: validated.data.password,
    })
    if (error) return { success: false, errors: { _: [error.message] } }
    return { success: true, errors: {} }
}

export async function update_sms_gateway(_prev: unknown, formData: FormData): Promise<ActionResult> {
    const supabase = createAdminClient()

    const validated = SmsGatewaySchema.safeParse({
        mode: formData.get('mode') ?? 'cloud',
        local_address: formData.get('local_address') ?? '',
        public_address: formData.get('public_address') ?? '',
        local_username: formData.get('local_username') ?? '',
        local_password: formData.get('local_password') ?? '',
        cloud_address: formData.get('cloud_address'),
        cloud_username: formData.get('cloud_username'),
        cloud_password: formData.get('cloud_password'),
        sim_slot: formData.get('sim_slot'),
        webhook_secret: formData.get('webhook_secret') ?? '',
    })

    if (!validated.success) {
        return { success: false, errors: validated.error.flatten().fieldErrors as Record<string, string[]> }
    }

    const userId = await getCurrentUserId()
    if (!userId) return { success: false, errors: { _: ['Not authenticated.'] } }

    const d = validated.data
    const profileUpdate: Record<string, unknown> = {
        id: userId,
        mode: d.mode,
        local_server: {
            local_address: d.local_address ?? '',
            public_address: d.public_address ?? '',
            username: d.local_username ?? '',
            password: d.local_password ?? '',
        },
        cloud_server: {
            server_address: d.cloud_address,
            username: d.cloud_username,
            password: d.cloud_password,
        },
        sim_slot: Number(d.sim_slot),
    }

    if (d.webhook_secret) {
        profileUpdate.webhook_secret = d.webhook_secret
    }

    const { error: upsertErr } = await supabase
        .from('profile')
        .upsert(
            profileUpdate,
            { onConflict: 'id' }
        )
    if (upsertErr) return { success: false, errors: { _: [upsertErr.message] } }

    // Re-register webhooks against the new credentials (best effort, doesn't block save success)
    const reg = await registerWebhooksForUser(userId)
    if (reg.warnings.length) {
        return { success: true, errors: { _webhook: reg.warnings }, webhookSecretSaved: Boolean(d.webhook_secret) }
    }
    return { success: true, errors: {}, webhookSecretSaved: Boolean(d.webhook_secret) }
}

/**
 * Re-register all relevant webhooks for the user against /api/webhooks/{token}.
 * Called from update_sms_gateway, but also exposed for manual re-registration.
 */
export async function reregister_webhooks(): Promise<{ ok: boolean; warnings: string[] }> {
    const userId = await getCurrentUserId()
    if (!userId) return { ok: false, warnings: ['Not authenticated.'] }
    const out = await registerWebhooksForUser(userId)
    return { ok: out.warnings.length === 0, warnings: out.warnings }
}

async function registerWebhooksForUser(userId: string): Promise<{ warnings: string[] }> {
    const warnings: string[] = []
    let profile
    try {
        profile = await loadGatewayProfile(userId)
    } catch (err) {
        return { warnings: [err instanceof Error ? err.message : 'Failed to load profile'] }
    }

    let creds
    try {
        creds = credentialsFromProfile(profile)
    } catch (err) {
        return { warnings: [err instanceof Error ? err.message : 'Invalid credentials'] }
    }

    const client = new SmsGatewayClient(creds)

    // Origin must be a public URL because the gateway reaches into it.
    const hdrs = await headers()
    const origin =
        process.env.WEBHOOK_BASE_URL ??
        process.env.NEXT_PUBLIC_SITE_URL ??
        hdrs.get('origin') ??
        (hdrs.get('host') ? `https://${hdrs.get('host')}` : '')

    if (!origin || origin.startsWith('http://localhost')) {
        warnings.push(
            'Webhook URL appears to be localhost — the SMS gateway cannot reach this server. Set WEBHOOK_BASE_URL to a public URL (Vercel, ngrok, etc.).'
        )
    }
    const webhookUrl = buildWebhookUrl(origin || 'http://localhost', profile.webhook_token)

    await client.clearAllWebhooks().catch((err) => {
        warnings.push(`Failed to clear old webhooks: ${err instanceof Error ? err.message : 'unknown'}`)
    })

    const events = profile.mode === 'local' ? LOCAL_SUPPORTED_EVENTS : ALL_WEBHOOK_EVENTS
    const registrations: Record<string, string> = {}
    for (const event of events) {
        try {
            const reg = await client.registerWebhook(webhookUrl, event, {
                id: `${userId.slice(0, 8)}-${event.replace(':', '-')}`,
            })
            registrations[event] = reg.id
        } catch (err) {
            warnings.push(`${event}: ${err instanceof Error ? err.message : 'register failed'}`)
        }
        await sleep(200)
    }

    const supabase = createAdminClient()
    await supabase
        .from('profile')
        .update({ webhook_registrations: registrations })
        .eq('id', userId)

    return { warnings }
}
