import { supabase } from '@/lib/supabase/client'
import { queryOptions } from '@tanstack/react-query'

export type ReportRange = '7d' | '30d' | '90d'

export type ReportSummaryItem = {
    label: string
    value: string
    detail: string
    change: string
    positive: boolean
}

export type ReportBucket = {
    label: string
    sent: number
    delivered: number
    failed: number
}

export type ReportStatusItem = {
    label: string
    value: number
    color: string
}

export type TopCampaignReport = {
    id: number
    name: string
    audience: string
    status: string
    sent: number
    delivered: number
    failed: number
    deliveryRate: number
}

export type AudienceHealthReport = {
    total: number
    subscribed: number
    optedOut: number
    undeliverable: number
    optOutRate: number
}

export type ReportsData = {
    rangeLabel: string
    summary: ReportSummaryItem[]
    buckets: ReportBucket[]
    statusBreakdown: ReportStatusItem[]
    topCampaigns: TopCampaignReport[]
    audienceHealth: AudienceHealthReport
}

type MessageRow = {
    campaign_id: number | null
    direction: string
    status: string
    created_at: string
}

type CampaignRow = {
    id: number
    campaign_name: string | null
    status: string | null
    segments: { name: string | null } | { name: string | null }[] | null
}

type ContactRow = {
    status: string | null
}

const RANGE_DAYS: Record<ReportRange, number> = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
}

const RANGE_LABELS: Record<ReportRange, string> = {
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
    '90d': 'Last 90 days',
}

const SENT_STATUSES = new Set(['queued', 'sent', 'delivered'])
const ATTEMPTED_STATUSES = new Set(['queued', 'sent', 'delivered', 'failed'])
const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-slate-400',
    queued: 'bg-blue-500',
    sent: 'bg-sky-500',
    delivered: 'bg-emerald-500',
    failed: 'bg-destructive',
}

function percent(numerator: number, denominator: number) {
    return denominator > 0 ? Math.round((numerator / denominator) * 100) : 0
}

function percentChange(current: number, previous: number) {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100)
}

function formatChange(value: number, suffix = '%') {
    if (value === 0) return `0${suffix}`
    return `${value > 0 ? '+' : ''}${value}${suffix}`
}

function isWithin(value: string, start: Date, end: Date) {
    const time = new Date(value).getTime()
    return Number.isFinite(time) && time >= start.getTime() && time < end.getTime()
}

function formatBucketLabel(date: Date, range: ReportRange) {
    return new Intl.DateTimeFormat('en', {
        month: 'short',
        day: range === '90d' ? undefined : 'numeric',
    }).format(date)
}

function getCampaignAudience(campaign?: CampaignRow) {
    const segment = Array.isArray(campaign?.segments) ? campaign?.segments[0] : campaign?.segments
    return segment?.name ?? 'No audience'
}

function getPeriodStats(messages: MessageRow[], start: Date, end: Date) {
    const stats = { sent: 0, attempted: 0, delivered: 0, failed: 0 }
    for (const message of messages) {
        if (!isWithin(message.created_at, start, end)) continue
        if (message.direction === 'outbound') {
            if (SENT_STATUSES.has(message.status)) stats.sent += 1
            if (ATTEMPTED_STATUSES.has(message.status)) stats.attempted += 1
            if (message.status === 'delivered') stats.delivered += 1
            if (message.status === 'failed') stats.failed += 1
        }
    }
    return stats
}

function buildBuckets(messages: MessageRow[], start: Date, end: Date, range: ReportRange): ReportBucket[] {
    const days = RANGE_DAYS[range]
    const bucketCount = range === '90d' ? 13 : days
    const spanMs = end.getTime() - start.getTime()
    const bucketMs = spanMs / bucketCount

    const buckets = Array.from({ length: bucketCount }, (_, index) => {
        const date = new Date(start.getTime() + index * bucketMs)
        return {
            label: formatBucketLabel(date, range),
            sent: 0,
            delivered: 0,
            failed: 0,
        }
    })

    for (const message of messages) {
        if (!isWithin(message.created_at, start, end)) continue
        const index = Math.min(
            bucketCount - 1,
            Math.floor((new Date(message.created_at).getTime() - start.getTime()) / bucketMs)
        )
        const bucket = buckets[index]
        if (message.direction === 'outbound') {
            if (SENT_STATUSES.has(message.status)) bucket.sent += 1
            if (message.status === 'delivered') bucket.delivered += 1
            if (message.status === 'failed') bucket.failed += 1
        }
    }

    return buckets
}

function buildStatusBreakdown(messages: MessageRow[], start: Date, end: Date): ReportStatusItem[] {
    const counts = new Map<string, number>()
    for (const message of messages) {
        if (message.direction !== 'outbound' || !isWithin(message.created_at, start, end)) continue
        counts.set(message.status, (counts.get(message.status) ?? 0) + 1)
    }

    return ['delivered', 'sent', 'queued', 'pending', 'failed'].map((status) => ({
        label: status.charAt(0).toUpperCase() + status.slice(1),
        value: counts.get(status) ?? 0,
        color: STATUS_COLORS[status] ?? 'bg-muted-foreground',
    }))
}

function buildTopCampaigns(
    messages: MessageRow[],
    campaigns: CampaignRow[],
    start: Date,
    end: Date
): TopCampaignReport[] {
    const campaignMap = new Map(campaigns.map((campaign) => [campaign.id, campaign]))
    const stats = new Map<number, { sent: number; delivered: number; failed: number }>()

    for (const message of messages) {
        if (!message.campaign_id || !isWithin(message.created_at, start, end)) continue
        const bucket = stats.get(message.campaign_id) ?? { sent: 0, delivered: 0, failed: 0 }
        if (message.direction === 'outbound') {
            if (SENT_STATUSES.has(message.status)) bucket.sent += 1
            if (message.status === 'delivered') bucket.delivered += 1
            if (message.status === 'failed') bucket.failed += 1
        }
        stats.set(message.campaign_id, bucket)
    }

    return [...stats.entries()]
        .map(([campaignId, bucket]) => {
            const campaign = campaignMap.get(campaignId)
            return {
                id: campaignId,
                name: campaign?.campaign_name ?? 'Untitled campaign',
                audience: getCampaignAudience(campaign),
                status: campaign?.status ?? 'Draft',
                sent: bucket.sent,
                delivered: bucket.delivered,
                failed: bucket.failed,
                deliveryRate: percent(bucket.delivered, bucket.sent + bucket.failed),
            }
        })
        .sort((a, b) => b.sent - a.sent)
        .slice(0, 5)
}

function buildAudienceHealth(contacts: ContactRow[]): AudienceHealthReport {
    const total = contacts.length
    const subscribed = contacts.filter((contact) => contact.status === 'Subscribed').length
    const optedOut = contacts.filter((contact) => contact.status === 'Opted Out').length
    const undeliverable = contacts.filter((contact) => contact.status === 'Undeliverable').length

    return {
        total,
        subscribed,
        optedOut,
        undeliverable,
        optOutRate: percent(optedOut, total),
    }
}

export const getReportsOption = (workspaceId?: string | null, range: ReportRange = '30d') =>
    queryOptions({
        queryKey: ['reports', workspaceId, range],
        enabled: Boolean(workspaceId),
        queryFn: async (): Promise<ReportsData> => {
            const days = RANGE_DAYS[range]
            const now = new Date()
            const currentStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
            const previousStart = new Date(now.getTime() - days * 2 * 24 * 60 * 60 * 1000)

            const [messagesResult, campaignsResult, contactsResult] = await Promise.all([
                supabase
                    .from('messages')
                    .select('campaign_id, direction, status, created_at')
                    .eq('workspace_id', workspaceId)
                    .gte('created_at', previousStart.toISOString()),
                supabase
                    .from('campaigns')
                    .select('id, campaign_name, status, segments(name)')
                    .eq('workspace_id', workspaceId),
                supabase
                    .from('contacts')
                    .select('status')
                    .eq('workspace_id', workspaceId),
            ])

            if (messagesResult.error) throw new Error(messagesResult.error.message)
            if (campaignsResult.error) throw new Error(campaignsResult.error.message)
            if (contactsResult.error) throw new Error(contactsResult.error.message)

            const messages = (messagesResult.data ?? []) as MessageRow[]
            const campaigns = (campaignsResult.data ?? []) as unknown as CampaignRow[]
            const contacts = (contactsResult.data ?? []) as ContactRow[]
            const current = getPeriodStats(messages, currentStart, now)
            const previous = getPeriodStats(messages, previousStart, currentStart)
            const deliveryRate = percent(current.delivered, current.attempted)
            const previousDeliveryRate = percent(previous.delivered, previous.attempted)
            const failureRate = percent(current.failed, current.attempted)
            const previousFailureRate = percent(previous.failed, previous.attempted)

            return {
                rangeLabel: RANGE_LABELS[range],
                summary: [
                    {
                        label: 'Messages Sent',
                        value: current.sent.toLocaleString(),
                        detail: `${current.attempted.toLocaleString()} attempted`,
                        change: formatChange(percentChange(current.sent, previous.sent)),
                        positive: current.sent >= previous.sent,
                    },
                    {
                        label: 'Delivery Rate',
                        value: `${deliveryRate}%`,
                        detail: `${current.delivered.toLocaleString()} delivered`,
                        change: formatChange(deliveryRate - previousDeliveryRate, ' pts'),
                        positive: deliveryRate >= previousDeliveryRate,
                    },
                    {
                        label: 'Failure Rate',
                        value: `${failureRate}%`,
                        detail: `${current.failed.toLocaleString()} failed`,
                        change: formatChange(failureRate - previousFailureRate, ' pts'),
                        positive: failureRate <= previousFailureRate,
                    },
                ],
                buckets: buildBuckets(messages, currentStart, now, range),
                statusBreakdown: buildStatusBreakdown(messages, currentStart, now),
                topCampaigns: buildTopCampaigns(messages, campaigns, currentStart, now),
                audienceHealth: buildAudienceHealth(contacts),
            }
        },
    })
