import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import {
    ALL_WEBHOOK_EVENTS,
    GatewayNotConfiguredError,
    buildWebhookUrl,
    getGatewayClientForWorkspace,
    sleep,
} from '@/lib/sms-gateway'
import { requireWorkspaceRole } from '@/lib/workspaces/server'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * Register webhooks for the active workspace.
 * Workflow:
 *  1. Load the workspace gateway client + settings (mode/credentials/token).
 *  2. Delete every existing webhook on the gateway to avoid orphans.
 *  3. Register the relevant events pointed at /api/webhooks/{token}.
 *  4. Persist the returned IDs onto workspace_sms_gateway.webhook_registrations.
 */
export async function POST(request: NextRequest) {
    let context
    try {
        context = await requireWorkspaceRole('admin')
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Not authorized' },
            { status: 403 }
        )
    }

    let gateway, profile
    try {
        ({ client: gateway, profile } = await getGatewayClientForWorkspace(context.workspace.id))
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

    // Clear stale registrations to avoid orphan webhooks on the gateway side
    await gateway.clearAllWebhooks().catch(() => 0)

    const registrations: Record<string, string> = {}
    const failures: Record<string, string> = {}
    for (const event of ALL_WEBHOOK_EVENTS) {
        try {
            const reg = await gateway.registerWebhook(webhookUrl, event, {
                id: `${profile.workspace_id.slice(0, 8)}-${event.replace(':', '-')}`,
            })
            registrations[event] = reg.id
        } catch (err) {
            failures[event] = err instanceof Error ? err.message : 'register failed'
        }
        await sleep(200)
    }

    const admin = createAdminClient()
    await admin
        .from('workspace_sms_gateway')
        .update({ webhook_registrations: registrations })
        .eq('workspace_id', context.workspace.id)

    const allOk = Object.keys(failures).length === 0
    return NextResponse.json(
        { success: allOk, mode: profile.mode, webhook_url: webhookUrl, registrations, failures },
        { status: allOk ? 200 : 207 }
    )
}
