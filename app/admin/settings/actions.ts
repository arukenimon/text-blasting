'use server'

import { createAdminClient, createClient } from '@/lib/supabase/server'
import { PasswordSchema, SmsGatewaySchema, WorkspaceNameSchema } from './schema'
import {
    ALL_WEBHOOK_EVENTS,
    SmsGatewayClient,
    buildWebhookUrl,
    credentialsFromProfile,
    loadGatewayProfile,
    sleep,
} from '@/lib/sms-gateway'
import { headers } from 'next/headers'
import { requireWorkspaceRole } from '@/lib/workspaces/server'

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
        cloud_address: formData.get('cloud_address'),
        cloud_username: formData.get('cloud_username'),
        cloud_password: formData.get('cloud_password'),
        sim_slot: formData.get('sim_slot'),
        webhook_secret: formData.get('webhook_secret') ?? '',
    })

    if (!validated.success) {
        return { success: false, errors: validated.error.flatten().fieldErrors as Record<string, string[]> }
    }

    let context
    try {
        context = await requireWorkspaceRole('admin')
    } catch (err) {
        return { success: false, errors: { _: [err instanceof Error ? err.message : 'Not authorized.'] } }
    }

    const d = validated.data
    const gatewayUpdate: Record<string, unknown> = {
        workspace_id: context.workspace.id,
        mode: 'cloud',
        local_server: null,
        cloud_server: {
            server_address: d.cloud_address,
            username: d.cloud_username,
            password: d.cloud_password,
        },
        sim_slot: Number(d.sim_slot),
    }

    if (d.webhook_secret) {
        gatewayUpdate.webhook_secret = d.webhook_secret
    }

    const { error: upsertErr } = await supabase
        .from('workspace_sms_gateway')
        .upsert(
            gatewayUpdate,
            { onConflict: 'workspace_id' }
        )
    if (upsertErr) return { success: false, errors: { _: [upsertErr.message] } }

    // Re-register webhooks against the new credentials (best effort, doesn't block save success)
    const reg = await registerWebhooksForWorkspace(context.workspace.id)
    if (reg.warnings.length) {
        return { success: true, errors: { _webhook: reg.warnings }, webhookSecretSaved: Boolean(d.webhook_secret) }
    }
    return { success: true, errors: {}, webhookSecretSaved: Boolean(d.webhook_secret) }
}

export async function update_workspace_name(_prev: unknown, formData: FormData): Promise<ActionResult> {
    const validated = WorkspaceNameSchema.safeParse({
        workspace_name: formData.get('workspace_name'),
    })

    if (!validated.success) {
        return { success: false, errors: validated.error.flatten().fieldErrors as Record<string, string[]> }
    }

    let context
    try {
        context = await requireWorkspaceRole('admin')
    } catch (err) {
        return { success: false, errors: { workspace_name: [err instanceof Error ? err.message : 'Not authorized.'] } }
    }

    const supabase = createAdminClient()
    const { error } = await supabase
        .from('workspaces')
        .update({ name: validated.data.workspace_name })
        .eq('id', context.workspace.id)

    if (error) return { success: false, errors: { workspace_name: [error.message] } }
    return { success: true, errors: {} }
}

/**
 * Re-register all relevant webhooks for the user against /api/webhooks/{token}.
 * Called from update_sms_gateway, but also exposed for manual re-registration.
 */
export async function reregister_webhooks(): Promise<{ ok: boolean; warnings: string[] }> {
    let context
    try {
        context = await requireWorkspaceRole('admin')
    } catch (err) {
        return { ok: false, warnings: [err instanceof Error ? err.message : 'Not authorized.'] }
    }
    const out = await registerWebhooksForWorkspace(context.workspace.id)
    return { ok: out.warnings.length === 0, warnings: out.warnings }
}

async function registerWebhooksForWorkspace(workspaceId: string): Promise<{ warnings: string[] }> {
    const warnings: string[] = []
    let profile
    try {
        profile = await loadGatewayProfile(workspaceId)
    } catch (err) {
        return { warnings: [err instanceof Error ? err.message : 'Failed to load gateway settings'] }
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

    let isLoopbackOrigin = false
    try {
        const hostname = new URL(origin).hostname
        isLoopbackOrigin = ['localhost', '127.0.0.1', '[::1]', '::1'].includes(hostname)
    } catch {
        isLoopbackOrigin = false
    }

    if (!origin || isLoopbackOrigin) {
        warnings.push(
            'Webhook URL appears to be local - the SMS gateway cannot reach this server. Set WEBHOOK_BASE_URL to a public URL (Vercel, ngrok, etc.).'
        )
    }
    const webhookUrl = buildWebhookUrl(origin || 'http://127.0.0.1:3000', profile.webhook_token)

    await client.clearAllWebhooks().catch((err) => {
        warnings.push(`Failed to clear old webhooks: ${err instanceof Error ? err.message : 'unknown'}`)
    })

    const registrations: Record<string, string> = {}
    for (const event of ALL_WEBHOOK_EVENTS) {
        try {
            const reg = await client.registerWebhook(webhookUrl, event, {
                id: `${workspaceId.slice(0, 8)}-${event.replace(':', '-')}`,
            })
            registrations[event] = reg.id
        } catch (err) {
            warnings.push(`${event}: ${err instanceof Error ? err.message : 'register failed'}`)
        }
        await sleep(200)
    }

    const supabase = createAdminClient()
    await supabase
        .from('workspace_sms_gateway')
        .update({ webhook_registrations: registrations })
        .eq('workspace_id', workspaceId)

    return { warnings }
}
