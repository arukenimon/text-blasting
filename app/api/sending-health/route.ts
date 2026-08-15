import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { GatewayNotConfiguredError, getGatewayClientForWorkspace } from '@/lib/sms-gateway'
import { requireWorkspaceRole, WorkspaceAccessError } from '@/lib/workspaces/server'

export const runtime = 'nodejs'

type MessageRow = {
    direction: string
    status: string
    created_at: string
}

type ContactRow = {
    status: string | null
}

const LOOKBACK_DAYS = 7
const ATTEMPTED_STATUSES = new Set(['queued', 'sent', 'delivered', 'failed'])

function percent(numerator: number, denominator: number) {
    return denominator > 0 ? Math.round((numerator / denominator) * 100) : null
}

function clampScore(value: number) {
    return Math.max(0, Math.min(100, Math.round(value)))
}

function getAudiencePenalty(optOutRate: number | null, undeliverableRate: number | null) {
    return Math.min(20, (optOutRate ?? 0) * 1.2 + (undeliverableRate ?? 0) * 1.6)
}

function getDeliveryScore(deliveryRate: number | null, failureRate: number | null, attempted: number) {
    if (attempted === 0 || deliveryRate === null || failureRate === null) return 30
    return Math.max(0, Math.min(30, deliveryRate * 0.3 - failureRate * 0.45))
}

function getStatusLabel(score: number, gatewayOk: boolean) {
    if (!gatewayOk) return 'Gateway offline'
    if (score >= 85) return 'Healthy'
    if (score >= 70) return 'Watch'
    return 'At risk'
}

function getTone(score: number, gatewayOk: boolean) {
    if (!gatewayOk || score < 70) return 'danger'
    if (score < 85) return 'warning'
    return 'healthy'
}

export async function GET() {
    let context
    try {
        context = await requireWorkspaceRole('member')
    } catch (err) {
        const status = err instanceof WorkspaceAccessError ? err.status : 403
        return NextResponse.json(
            { ok: false, error: err instanceof Error ? err.message : 'Not authorized' },
            { status }
        )
    }

    const workspaceId = context.workspace.id
    const admin = createAdminClient()
    const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString()

    const gateway = await getGatewayClientForWorkspace(workspaceId)
        .then(({ client }) => client.checkCloudDeviceHealth())
        .catch((err) => ({
            ok: false,
            mode: 'cloud' as const,
            checked: 'cloud-devices' as const,
            error: err instanceof GatewayNotConfiguredError
                ? err.message
                : err instanceof Error
                    ? err.message
                    : 'unknown',
        }))

    const [messagesResult, contactsResult] = await Promise.all([
        admin
            .from('messages')
            .select('direction, status, created_at')
            .eq('workspace_id', workspaceId)
            .gte('created_at', since),
        admin
            .from('contacts')
            .select('status')
            .eq('workspace_id', workspaceId),
    ])

    if (messagesResult.error) {
        return NextResponse.json({ ok: false, error: messagesResult.error.message }, { status: 500 })
    }
    if (contactsResult.error) {
        return NextResponse.json({ ok: false, error: contactsResult.error.message }, { status: 500 })
    }

    const messages = (messagesResult.data ?? []) as MessageRow[]
    const contacts = (contactsResult.data ?? []) as ContactRow[]
    const outbound = messages.filter((message) => message.direction === 'outbound')
    const attempted = outbound.filter((message) => ATTEMPTED_STATUSES.has(message.status)).length
    const delivered = outbound.filter((message) => message.status === 'delivered').length
    const failed = outbound.filter((message) => message.status === 'failed').length
    const deliveryRate = percent(delivered, attempted)
    const failureRate = percent(failed, attempted)
    const optedOut = contacts.filter((contact) => contact.status === 'Opted Out').length
    const undeliverable = contacts.filter((contact) => contact.status === 'Undeliverable').length
    const optOutRate = percent(optedOut, contacts.length)
    const undeliverableRate = percent(undeliverable, contacts.length)
    const gatewayScore = gateway.ok ? 50 : 0
    const deliveryScore = getDeliveryScore(deliveryRate, failureRate, attempted)
    const audienceScore = Math.max(0, 20 - getAudiencePenalty(optOutRate, undeliverableRate))
    const rawScore = gatewayScore + deliveryScore + audienceScore
    const score = clampScore(gateway.ok ? rawScore : Math.min(35, rawScore))

    return NextResponse.json({
        ok: true,
        score,
        label: getStatusLabel(score, gateway.ok),
        tone: getTone(score, gateway.ok),
        updatedAt: new Date().toISOString(),
        lookbackDays: LOOKBACK_DAYS,
        signals: {
            gateway,
            delivery: {
                attempted,
                delivered,
                failed,
                deliveryRate,
                failureRate,
            },
            audience: {
                total: contacts.length,
                optedOut,
                undeliverable,
                optOutRate,
                undeliverableRate,
            },
        },
    })
}
