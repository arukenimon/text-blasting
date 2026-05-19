import { supabase } from '@/lib/supabase/client'
import { queryOptions } from '@tanstack/react-query'

export const getCampaignOption = () =>
    queryOptions({
        queryKey: ['get-campaigns'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('campaigns')
                .select(
                    '*, segments(id,name,contacts(full_name,phone_no)), templates(id,template_name,body)'
                )
                .order('created_at', { ascending: false })
            if (error) throw new Error(error.message)
            return data
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
export const getCampaignStatsOption = () =>
    queryOptions({
        queryKey: ['campaign-stats'],
        queryFn: async (): Promise<Record<string, CampaignStatsRow>> => {
            const { data, error } = await supabase
                .from('messages')
                .select('campaign_id, status')
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
