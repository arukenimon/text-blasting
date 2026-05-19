import crypto from 'crypto'
import type { WebhookEvent, WebhookEventType } from './types'

export const ALL_WEBHOOK_EVENTS: WebhookEventType[] = [
    'sms:received',
    'sms:sent',
    'sms:delivered',
    'sms:failed',
    'sms:data-received',
    'mms:received',
    'mms:downloaded',
    'system:ping',
]

/** Local device firmware only forwards the core lifecycle events. */
export const LOCAL_SUPPORTED_EVENTS: WebhookEventType[] = [
    'sms:received',
    'sms:sent',
    'sms:delivered',
    'sms:failed',
]

/** Verify HMAC-SHA256(payload + timestamp) against gateway's `x-signature` header. */
export function verifySignature(
    secretKey: string,
    rawBody: string,
    timestamp: string,
    signature: string
): boolean {
    if (!secretKey || !rawBody || !timestamp || !signature) return false
    const expected = crypto
        .createHmac('sha256', secretKey)
        .update(rawBody + timestamp)
        .digest('hex')
    const provided = String(signature).trim().toLowerCase()
    if (provided.length !== expected.length) return false
    try {
        return crypto.timingSafeEqual(
            Buffer.from(expected, 'hex'),
            Buffer.from(provided, 'hex')
        )
    } catch {
        return false
    }
}

/** Reject replays: gateway sends current timestamp; we allow ±5 minutes. */
export function isTimestampFresh(timestampHeader: string, toleranceSeconds = 300): boolean {
    const ts = Number(timestampHeader)
    if (!Number.isFinite(ts)) return false
    const now = Math.floor(Date.now() / 1000)
    return Math.abs(now - ts) <= toleranceSeconds
}

/** Idempotency key — sha256 of the raw body. Bulletproof across event shapes. */
export function eventIdempotencyKey(rawBody: string): string {
    return crypto.createHash('sha256').update(rawBody).digest('hex')
}

/** Narrow a parsed JSON object to our discriminated WebhookEvent union. */
export function parseEvent(raw: unknown): WebhookEvent | null {
    if (!raw || typeof raw !== 'object') return null
    const obj = raw as { event?: unknown; payload?: unknown }
    if (typeof obj.event !== 'string') return null
    if (!ALL_WEBHOOK_EVENTS.includes(obj.event as WebhookEventType)) return null
    return { event: obj.event as WebhookEventType, payload: (obj.payload ?? {}) as never } as WebhookEvent
}
