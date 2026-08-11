import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import {
    applyWebhookEvent,
    eventIdempotencyKey,
    isTimestampFresh,
    parseEvent,
    verifySignature,
} from '@/lib/sms-gateway'

export const runtime = 'nodejs'

/**
 * Workspace webhook receiver.
 * URL: /api/webhooks/{workspace_sms_gateway.webhook_token}
 * Headers expected: x-signature, x-timestamp (added by sms-gate.app gateway).
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    const { token } = await params
    const rawBody = await request.text()
    const signature = request.headers.get('x-signature') ?? ''
    const timestamp = request.headers.get('x-timestamp') ?? ''

    if (!isTimestampFresh(timestamp)) {
        return NextResponse.json({ error: 'Timestamp expired' }, { status: 401 })
    }

    const admin = createAdminClient()

    // Look up workspace gateway by webhook_token. We use service role to bypass RLS.
    const { data: gateway, error: gatewayErr } = await admin
        .from('workspace_sms_gateway')
        .select('workspace_id, webhook_secret')
        .eq('webhook_token', token)
        .maybeSingle()

    if (gatewayErr || !gateway) {
        // 404 leaks less info than 401 about whether the token format is valid
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    if (!verifySignature(gateway.webhook_secret, rawBody, timestamp, signature)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    let parsedJson: unknown
    try {
        parsedJson = JSON.parse(rawBody)
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const evt = parseEvent(parsedJson)
    if (!evt) {
        return NextResponse.json({ error: 'Unrecognized event' }, { status: 200 })
    }

    // Idempotency: insert into dedupe table; primary-key conflict = already seen.
    const eventId = eventIdempotencyKey(rawBody)
    const { error: dedupeErr } = await admin.from('processed_webhook_events').insert({
        workspace_id: gateway.workspace_id,
        user_id: null,
        gateway_event_id: eventId,
    })

    if (dedupeErr) {
        // Duplicate-key collision: silently succeed so the gateway stops retrying.
        if (dedupeErr.code === '23505') {
            return NextResponse.json({ deduped: true })
        }
        console.error('[webhook] dedupe insert failed', dedupeErr)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }

    try {
        const result = await applyWebhookEvent(admin, gateway.workspace_id, evt)
        return NextResponse.json({ ok: true, ...result })
    } catch (err) {
        console.error('[webhook] applyWebhookEvent failed', err)
        // Best-effort: leave the dedupe entry so we don't reprocess a bad payload forever.
        return NextResponse.json({ error: 'Failed to apply event' }, { status: 500 })
    }
}
