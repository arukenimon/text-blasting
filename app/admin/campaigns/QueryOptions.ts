import { supabase } from '@/lib/supabase/client'
import { queryOptions } from '@tanstack/react-query'

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
    enabled = true,
}: AudiencePreviewParams) =>
    queryOptions({
        queryKey: ['campaign-audience-preview', workspaceId, segmentId],
        enabled: Boolean(enabled && workspaceId && segmentId),
        queryFn: async () => {
            const { data, error, count } = await supabase
                .from('contacts')
                .select('id, full_name, phone_no', { count: 'exact' })
                .eq('workspace_id', workspaceId)
                .eq('segment_id', segmentId)
                .order('created_at', { ascending: false })
                .limit(5)

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
