import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import {
    ALL_WEBHOOK_EVENTS,
    GatewayNotConfiguredError,
    LOCAL_SUPPORTED_EVENTS,
    buildWebhookUrl,
    getGatewayClientForUser,
    sleep,
} from '@/lib/sms-gateway'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * Register webhooks for the authenticated user.
 * Workflow:
 *  1. Load this user's gateway client + profile (mode/credentials/token).
 *  2. Delete every existing webhook on the gateway to avoid orphans.
 *  3. Register the relevant events pointed at /api/webhooks/{token}.
 *  4. Persist the returned IDs onto profile.webhook_registrations.
 */
export async function POST(request: NextRequest) {
    const session = await createClient()
    const { data: { user } } = await session.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    let gateway, profile
    try {
        ({ client: gateway, profile } = await getGatewayClientForUser(user.id))
    } catch (err) {
        if (err instanceof GatewayNotConfiguredError) {
            return NextResponse.json({ error: err.message }, { status: 400 })
        }
        throw err
    }

    const origin = request.headers.get('origin') ?? request.nextUrl.origin
    const webhookUrl = buildWebhookUrl(
        process.env.WEBHOOK_BASE_URL ?? origin,
        profile.webhook_token
    )

    const events = profile.mode === 'local' ? LOCAL_SUPPORTED_EVENTS : ALL_WEBHOOK_EVENTS

    // Clear stale registrations to avoid orphan webhooks on the gateway side
    await gateway.clearAllWebhooks().catch(() => 0)

    const registrations: Record<string, string> = {}
    const failures: Record<string, string> = {}
    for (const event of events) {
        try {
            const reg = await gateway.registerWebhook(webhookUrl, event, {
                id: `${profile.user_id.slice(0, 8)}-${event.replace(':', '-')}`,
            })
            registrations[event] = reg.id
        } catch (err) {
            failures[event] = err instanceof Error ? err.message : 'register failed'
        }
        await sleep(200)
    }

    const admin = createAdminClient()
    await admin
        .from('profile')
        .update({ webhook_registrations: registrations })
        .eq('id', user.id)

    const allOk = Object.keys(failures).length === 0
    return NextResponse.json(
        { success: allOk, mode: profile.mode, webhook_url: webhookUrl, registrations, failures },
        { status: allOk ? 200 : 207 }
    )
}
