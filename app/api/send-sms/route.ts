import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import {
    GatewayNotConfiguredError,
    SmsGatewayError,
    getGatewayClientForWorkspace,
} from '@/lib/sms-gateway'
import { requireWorkspaceRole } from '@/lib/workspaces/server'

export const runtime = 'nodejs'

/**
 * Ad-hoc single-message send. Used for one-off / debug sends; campaigns go
 * through /api/campaigns/[id]/send instead.
 *
 * Expected body: { textMessage: { text }, phoneNumbers: string[], simNumber?: number }
 */
export async function POST(request: NextRequest) {
    let context
    try {
        context = await requireWorkspaceRole('member')
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Not authorized' },
            { status: 403 }
        )
    }

    let body: { textMessage?: { text?: string }; phoneNumbers?: string[]; simNumber?: number }
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const text = body.textMessage?.text?.trim()
    const phoneNumbers = (body.phoneNumbers ?? []).filter(Boolean)
    if (!text) return NextResponse.json({ error: 'textMessage.text is required' }, { status: 400 })
    if (phoneNumbers.length === 0) return NextResponse.json({ error: 'phoneNumbers is required' }, { status: 400 })

    let gateway, profile
    try {
        ({ client: gateway, profile } = await getGatewayClientForWorkspace(context.workspace.id))
    } catch (err) {
        if (err instanceof GatewayNotConfiguredError) {
            return NextResponse.json({ error: err.message }, { status: 400 })
        }
        throw err
    }

    const simNumber = body.simNumber ?? profile.sim_slot ?? 1
    const admin = createAdminClient()
    const gatewayHealth = await gateway.checkCloudDeviceHealth()
    if (!gatewayHealth.ok) {
        return NextResponse.json(
            {
                error: gatewayHealth.error ?? 'No recently active SMS Gateway sender device found.',
                gateway: gatewayHealth,
            },
            { status: 400 }
        )
    }

    // Insert pending rows up-front so the UI sees them immediately.
    const pendingRows = phoneNumbers.map((phone) => ({
        workspace_id: context.workspace.id,
        user_id: context.userId,
        direction: 'outbound' as const,
        phone_no: phone,
        body: text,
        status: 'pending' as const,
        sim_slot: simNumber,
    }))
    const { data: inserted, error: insertErr } = await admin
        .from('messages')
        .insert(pendingRows)
        .select('id')
    if (insertErr) {
        return NextResponse.json({ error: insertErr.message }, { status: 500 })
    }

    const insertedIds = (inserted ?? []).map((r) => r.id)

    try {
        const resp = await gateway.sendMessage({
            textMessage: { text },
            phoneNumbers,
            simNumber,
        })
        await admin
            .from('messages')
            .update({ status: 'queued', gateway_message_id: resp.id })
            .in('id', insertedIds)
        return NextResponse.json({ ok: true, gateway: resp, message_ids: insertedIds })
    } catch (err) {
        const message =
            err instanceof SmsGatewayError ? err.message :
            err instanceof Error ? err.message : 'Gateway send failed'
        await admin
            .from('messages')
            .update({
                status: 'failed',
                failed_at: new Date().toISOString(),
                error_reason: message,
            })
            .in('id', insertedIds)
        const status = err instanceof SmsGatewayError ? err.status : 502
        return NextResponse.json({ error: message }, { status })
    }
}
