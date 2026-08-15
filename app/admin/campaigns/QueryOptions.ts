import { supabase } from '@/lib/supabase/client'
import { queryOptions } from '@tanstack/react-query'
import type { StatItem } from '@/app/components/dashboard/dashboard-data'

export type CampaignPageParams = {
    workspaceId?: string | null
    page: number
    pageSize: number
    tab: string
    search: string
    sort: string
}

export type AudiencePreviewParams = {
    workspaceId?: string | null
    segmentId?: string | null
    contactIds?: string[] | null
    enabled?: boolean
}

export const getCampaignOption = (workspaceId?: string | null) =>
    queryOptions({
        queryKey: ['get-campaigns', workspaceId],
        enabled: Boolean(workspaceId),
        queryFn: async () => {
            const { data, error } = await supabase
                .from('campaigns')
                .select(
                    '*, segments(id,name,contacts(count)), templates(id,template_name,body)'
                )
                .eq('workspace_id', workspaceId)
                .order('created_at', { ascending: false })
            if (error) throw new Error(error.message)
            return data
        },
    })

export const getRecentCampaignsOption = (workspaceId?: string | null, limit = 8) =>
    queryOptions({
        queryKey: ['recent-campaigns', workspaceId, limit],
        enabled: Boolean(workspaceId),
        queryFn: async () => {
            const { data, error, count } = await supabase
                .from('campaigns')
                .select(
                    '*, segments(id,name,contacts(count)), templates(id,template_name,body)',
                    { count: 'exact' }
                )
                .eq('workspace_id', workspaceId)
                .order('created_at', { ascending: false })
                .limit(limit)
            if (error) throw new Error(error.message)
            return {
                data: data ?? [],
                count: count ?? 0,
            }
        },
    })

function normalizeSearch(value: string) {
    return value.replace(/[,%()]/g, ' ').trim()
}

function toStatus(tab: string) {
    return tab.charAt(0).toUpperCase() + tab.slice(1)
}

async function getRelatedSearchFilters(workspaceId: string, search: string) {
    const pattern = `%${search}%`
    const [segmentsResult, templatesResult] = await Promise.all([
        supabase.from('segments').select('id').eq('workspace_id', workspaceId).ilike('name', pattern),
        supabase.from('templates').select('id').eq('workspace_id', workspaceId).ilike('template_name', pattern),
    ])

    if (segmentsResult.error) throw new Error(segmentsResult.error.message)
    if (templatesResult.error) throw new Error(templatesResult.error.message)

    const filters = [
        `campaign_name.ilike.${pattern}`,
        `message_body.ilike.${pattern}`,
    ]
    const segmentIds = (segmentsResult.data ?? []).map((segment) => segment.id)
    const templateIds = (templatesResult.data ?? []).map((template) => template.id)

    if (segmentIds.length > 0) filters.push(`segment_id.in.(${segmentIds.join(',')})`)
    if (templateIds.length > 0) filters.push(`template_id.in.(${templateIds.join(',')})`)

    return filters.join(',')
}

export const getCampaignPageOption = ({
    workspaceId,
    page,
    pageSize,
    tab,
    search,
    sort,
}: CampaignPageParams) =>
    queryOptions({
        queryKey: ['get-campaigns', workspaceId, 'page', { page, pageSize, tab, search, sort }],
        enabled: Boolean(workspaceId),
        placeholderData: (previousData) => previousData,
        queryFn: async () => {
            const from = (page - 1) * pageSize
            const to = from + pageSize - 1
            const normalizedSearch = normalizeSearch(search)
            let query = supabase
                .from('campaigns')
                .select(
                    '*, segments(id,name,contacts(count)), templates(id,template_name,body)',
                    { count: 'exact' }
                )
                .eq('workspace_id', workspaceId)

            if (tab !== 'all') {
                query = query.eq('status', toStatus(tab))
            }

            if (normalizedSearch) {
                query = query.or(await getRelatedSearchFilters(workspaceId!, normalizedSearch))
            }

            if (sort === 'sent') {
                const [campaignsResult, messagesResult] = await Promise.all([
                    query.order('created_at', { ascending: false }),
                    supabase
                        .from('messages')
                        .select('campaign_id')
                        .eq('workspace_id', workspaceId)
                        .eq('direction', 'outbound')
                        .not('campaign_id', 'is', null),
                ])

                if (campaignsResult.error) throw new Error(campaignsResult.error.message)
                if (messagesResult.error) throw new Error(messagesResult.error.message)

                const sentCounts = new Map<number, number>()
                for (const message of messagesResult.data ?? []) {
                    if (message.campaign_id == null) continue
                    sentCounts.set(message.campaign_id, (sentCounts.get(message.campaign_id) ?? 0) + 1)
                }

                const sorted = [...(campaignsResult.data ?? [])].sort(
                    (a, b) => (sentCounts.get(b.id) ?? 0) - (sentCounts.get(a.id) ?? 0)
                )

                return {
                    data: sorted.slice(from, to + 1),
                    count: campaignsResult.count ?? sorted.length,
                }
            }

            const { data, error, count } = await query
                .order('created_at', { ascending: sort === 'oldest' })
                .range(from, to)

            if (error) throw new Error(error.message)

            return {
                data: data ?? [],
                count: count ?? 0,
            }
        },
    })

export const getAudiencePreviewContactsOption = ({
    workspaceId,
    segmentId,
    contactIds,
    enabled = true,
}: AudiencePreviewParams) =>
    queryOptions({
        queryKey: ['campaign-audience-preview', workspaceId, segmentId, contactIds ?? []],
        enabled: Boolean(enabled && workspaceId && (segmentId || contactIds?.length)),
        queryFn: async () => {
            let query = supabase
                .from('contacts')
                .select('id, full_name, phone_no', { count: 'exact' })
                .eq('workspace_id', workspaceId)
                .order('created_at', { ascending: false })
                .limit(5)

            if (contactIds?.length) {
                query = query.in('id', contactIds)
            } else {
                query = query.eq('segment_id', segmentId)
            }

            const { data, error, count } = await query

            if (error) throw new Error(error.message)

            return {
                data: data ?? [],
                count: count ?? 0,
            }
        },
    })

export const getCampaignStatusCountsOption = (workspaceId?: string | null) =>
    queryOptions({
        queryKey: ['campaign-status-counts', workspaceId],
        enabled: Boolean(workspaceId),
        queryFn: async () => {
            const { data, error } = await supabase
                .from('campaigns')
                .select('status')
                .eq('workspace_id', workspaceId)

            if (error) throw new Error(error.message)

            const counts: Record<string, number> = { all: data?.length ?? 0 }
            for (const row of data ?? []) {
                const key = (row.status ?? 'Draft').toLowerCase()
                counts[key] = (counts[key] ?? 0) + 1
            }

            return counts
        },
    })

export type CampaignStatsRow = {
    campaign_id: number
    pending: number
    queued: number
    sent: number
    delivered: number
    failed: number
    received: number
    total: number
}

/**
 * Aggregate message counts per status per campaign. Keyed by campaign id
 * (coerced to string for object lookup). Done client-side over a lightweight
 * projection — fine for typical campaign sizes. For larger volumes, move
 * this to a Postgres view.
 */
export const getCampaignStatsOption = (workspaceId?: string | null) =>
    queryOptions({
        queryKey: ['campaign-stats', workspaceId],
        enabled: Boolean(workspaceId),
        queryFn: async (): Promise<Record<string, CampaignStatsRow>> => {
            const { data, error } = await supabase
                .from('messages')
                .select('campaign_id, status')
                .eq('workspace_id', workspaceId)
                .eq('direction', 'outbound')
                .not('campaign_id', 'is', null)
            if (error) throw new Error(error.message)

            const out: Record<string, CampaignStatsRow> = {}
            for (const row of (data ?? []) as { campaign_id: number | null; status: string }[]) {
                if (row.campaign_id == null) continue
                const key = String(row.campaign_id)
                const bucket =
                    out[key] ??
                    (out[key] = {
                        campaign_id: row.campaign_id,
                        pending: 0,
                        queued: 0,
                        sent: 0,
                        delivered: 0,
                        failed: 0,
                        received: 0,
                        total: 0,
                    })
                const k = row.status as keyof Omit<CampaignStatsRow, 'campaign_id' | 'total'>
                if (k in bucket) bucket[k] += 1
                bucket.total += 1
            }
            return out
        },
    })

type DashboardMessageRow = {
    direction: string
    status: string
    created_at: string
}

type DashboardContactRow = {
    status: string | null
    created_at: string
    updated_at: string | null
}

type PeriodMessageStats = {
    sent: number
    attempted: number
    delivered: number
    replies: number
}

const SENT_STATUSES = new Set(['queued', 'sent', 'delivered'])
const ATTEMPTED_STATUSES = new Set(['queued', 'sent', 'delivered', 'failed'])

function within(value: string, start: Date, end: Date) {
    const time = new Date(value).getTime()
    return Number.isFinite(time) && time >= start.getTime() && time < end.getTime()
}

function getPeriodMessageStats(messages: DashboardMessageRow[], start: Date, end: Date): PeriodMessageStats {
    const stats: PeriodMessageStats = { sent: 0, attempted: 0, delivered: 0, replies: 0 }

    for (const message of messages) {
        if (!within(message.created_at, start, end)) continue
        if (message.direction === 'outbound') {
            if (SENT_STATUSES.has(message.status)) stats.sent += 1
            if (ATTEMPTED_STATUSES.has(message.status)) stats.attempted += 1
            if (message.status === 'delivered') stats.delivered += 1
        }
        if (message.direction === 'inbound' || message.status === 'received') {
            stats.replies += 1
        }
    }

    return stats
}

function percent(numerator: number, denominator: number) {
    return denominator > 0 ? Math.round((numerator / denominator) * 100) : 0
}

function percentChange(current: number, previous: number) {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100)
}

function formatDelta(value: number, unit = '%') {
    if (value === 0) return `0${unit}`
    return `${value > 0 ? '+' : ''}${value}${unit}`
}

function getOptOutSnapshot(contacts: DashboardContactRow[], before?: Date) {
    const visibleContacts = before
        ? contacts.filter((contact) => within(contact.created_at, new Date(0), before))
        : contacts
    const optedOut = visibleContacts.filter((contact) => {
        if (contact.status !== 'Opted Out') return false
        if (!before) return true
        const statusTime = contact.updated_at ?? contact.created_at
        return within(statusTime, new Date(0), before)
    }).length

    return {
        total: visibleContacts.length,
        optedOut,
        rate: percent(optedOut, visibleContacts.length),
    }
}

export const getDashboardStatsOption = (workspaceId?: string | null) =>
    queryOptions({
        queryKey: ['dashboard-stats', workspaceId],
        enabled: Boolean(workspaceId),
        queryFn: async (): Promise<StatItem[]> => {
            const now = new Date()
            const currentStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            const previousStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

            const [messagesResult, contactsResult] = await Promise.all([
                supabase
                    .from('messages')
                    .select('direction, status, created_at')
                    .eq('workspace_id', workspaceId)
                    .gte('created_at', previousStart.toISOString()),
                supabase
                    .from('contacts')
                    .select('status, created_at, updated_at')
                    .eq('workspace_id', workspaceId),
            ])

            if (messagesResult.error) throw new Error(messagesResult.error.message)
            if (contactsResult.error) throw new Error(contactsResult.error.message)

            const messages = (messagesResult.data ?? []) as DashboardMessageRow[]
            const contacts = (contactsResult.data ?? []) as DashboardContactRow[]
            const current = getPeriodMessageStats(messages, currentStart, now)
            const previous = getPeriodMessageStats(messages, previousStart, currentStart)
            const deliveryRate = percent(current.delivered, current.attempted)
            const previousDeliveryRate = percent(previous.delivered, previous.attempted)
            const replyRate = percent(current.replies, current.sent)
            const previousReplyRate = percent(previous.replies, previous.sent)
            const optOut = getOptOutSnapshot(contacts)
            const previousOptOut = getOptOutSnapshot(contacts, currentStart)

            const sentDelta = percentChange(current.sent, previous.sent)
            const deliveryDelta = deliveryRate - previousDeliveryRate
            const replyDelta = replyRate - previousReplyRate
            const optOutDelta = optOut.rate - previousOptOut.rate

            return [
                {
                    label: 'Messages Sent',
                    value: current.sent.toLocaleString(),
                    trend: formatDelta(sentDelta),
                    positive: sentDelta >= 0,
                    accentColor: 'border-violet-500',
                },
                {
                    label: 'Delivery Rate',
                    value: `${deliveryRate}%`,
                    trend: formatDelta(deliveryDelta, ' pts'),
                    positive: deliveryDelta >= 0,
                    accentColor: 'border-emerald-500',
                },
                {
                    label: 'Reply Rate',
                    value: `${replyRate}%`,
                    trend: formatDelta(replyDelta, ' pts'),
                    positive: replyDelta >= 0,
                    accentColor: 'border-sky-500',
                },
                {
                    label: 'Opt-out Rate',
                    value: `${optOut.rate}%`,
                    trend: formatDelta(optOutDelta, ' pts'),
                    positive: optOutDelta <= 0,
                    accentColor: 'border-amber-500',
                },
            ]
        },
    })
