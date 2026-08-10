import type { SupabaseClient } from '@supabase/supabase-js'
import type { WebhookEvent } from './types'

type Admin = SupabaseClient

/**
 * Apply a webhook event to the messages table for a given user.
 * - Outbound lifecycle events update an existing row keyed by (user_id, gateway_message_id).
 *   If no row exists yet (e.g. send happened before the row was inserted), the row is created.
 * - Inbound events insert a new row with direction='inbound'.
 * - system:ping is recorded only on the dedupe table (no message row).
 */
export async function applyWebhookEvent(
    admin: Admin,
    userId: string,
    evt: WebhookEvent
): Promise<{ table: 'messages' | 'none'; action: 'insert' | 'update' | 'skip' }> {
    switch (evt.event) {
        case 'sms:sent': {
            const { messageId, recipient, simNumber, partsCount, sentAt } = evt.payload
            await upsertOutbound(admin, userId, messageId, {
                status: 'sent',
                sent_at: sentAt,
                phone_no: recipient,
                sim_slot: simNumber,
                parts_count: partsCount,
            })
            return { table: 'messages', action: 'update' }
        }
        case 'sms:delivered': {
            const { messageId, recipient, simNumber, deliveredAt } = evt.payload
            await upsertOutbound(admin, userId, messageId, {
                status: 'delivered',
                delivered_at: deliveredAt,
                phone_no: recipient,
                sim_slot: simNumber,
            })
            return { table: 'messages', action: 'update' }
        }
        case 'sms:failed': {
            const { messageId, recipient, simNumber, reason, failedAt } = evt.payload
            await upsertOutbound(admin, userId, messageId, {
                status: 'failed',
                failed_at: failedAt,
                error_reason: reason,
                phone_no: recipient,
                sim_slot: simNumber,
            })
            return { table: 'messages', action: 'update' }
        }
        case 'sms:received': {
            const { messageId, message, sender, simNumber, receivedAt } = evt.payload
            await insertInbound(admin, userId, {
                gateway_message_id: messageId ?? null,
                phone_no: sender,
                body: message,
                sim_slot: simNumber,
                received_at: receivedAt,
            })
            return { table: 'messages', action: 'insert' }
        }
        case 'sms:data-received': {
            const { messageId, data, sender, simNumber, receivedAt } = evt.payload
            await insertInbound(admin, userId, {
                gateway_message_id: messageId ?? null,
                phone_no: sender,
                body: '',
                sim_slot: simNumber,
                received_at: receivedAt,
                metadata: { kind: 'data', data },
            })
            return { table: 'messages', action: 'insert' }
        }
        case 'mms:received':
        case 'mms:downloaded': {
            const { messageId, subject, sender, simNumber, receivedAt, transactionId } = evt.payload
            await insertInbound(admin, userId, {
                gateway_message_id: messageId ?? null,
                phone_no: sender,
                body: '',
                subject: subject ?? null,
                sim_slot: simNumber,
                received_at: receivedAt,
                metadata: { kind: evt.event, transactionId },
            })
            return { table: 'messages', action: 'insert' }
        }
        case 'system:ping':
            return { table: 'none', action: 'skip' }
    }
}

// ── helpers ──────────────────────────────────────────────────────────────────

type OutboundUpdate = {
    status: 'sent' | 'delivered' | 'failed'
    sent_at?: string
    delivered_at?: string
    failed_at?: string
    error_reason?: string
    phone_no?: string
    sim_slot?: number
    parts_count?: number
}

async function upsertOutbound(
    admin: Admin,
    userId: string,
    gatewayMessageId: string,
    patch: OutboundUpdate
) {
    if (!gatewayMessageId) return

    let existingQuery = admin
        .from('messages')
        .select('id, status')
        .eq('user_id', userId)
        .eq('gateway_message_id', gatewayMessageId)
        .order('created_at', { ascending: true })
        .limit(1)

    if (patch.phone_no) {
        existingQuery = existingQuery.eq('phone_no', patch.phone_no)
    }

    const { data: existingRows } = await existingQuery
    const existing = existingRows?.[0]

    // Don't downgrade a terminal status: delivered/failed beats sent.
    if (existing) {
        if (existing.status === 'delivered' && patch.status === 'sent') return
        if (existing.status === 'failed' && patch.status === 'sent') return
        await admin
            .from('messages')
            .update({
                status: patch.status,
                sent_at: patch.sent_at ?? undefined,
                delivered_at: patch.delivered_at ?? undefined,
                failed_at: patch.failed_at ?? undefined,
                error_reason: patch.error_reason ?? undefined,
                sim_slot: patch.sim_slot ?? undefined,
                parts_count: patch.parts_count ?? undefined,
            })
            .eq('id', existing.id)
        return
    }

    // Late webhook: the gateway acknowledged the send before we wrote the row.
    // Create a minimal placeholder so the status is captured.
    await admin.from('messages').insert({
        user_id: userId,
        direction: 'outbound',
        phone_no: patch.phone_no ?? '',
        body: '',
        gateway_message_id: gatewayMessageId,
        status: patch.status,
        sent_at: patch.sent_at,
        delivered_at: patch.delivered_at,
        failed_at: patch.failed_at,
        error_reason: patch.error_reason,
        sim_slot: patch.sim_slot,
        parts_count: patch.parts_count,
        metadata: { recovered: true },
    })
}

type InboundInsert = {
    gateway_message_id: string | null
    phone_no: string
    body: string
    sim_slot?: number
    received_at: string
    subject?: string | null
    metadata?: Record<string, unknown>
}

async function insertInbound(admin: Admin, userId: string, row: InboundInsert) {
    await admin.from('messages').insert({
        user_id: userId,
        direction: 'inbound',
        phone_no: row.phone_no,
        body: row.body,
        gateway_message_id: row.gateway_message_id,
        status: 'received',
        received_at: row.received_at,
        sim_slot: row.sim_slot,
        subject: row.subject,
        metadata: row.metadata ?? {},
    })
}
