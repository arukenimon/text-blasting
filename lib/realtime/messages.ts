import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

type Options = {
    /** When provided, only listen to changes for messages of a single campaign. */
    campaignId?: string
    /** Extra query keys to invalidate alongside ['messages', ...]. */
    additionalKeys?: readonly unknown[][]
}

/**
 * Subscribe to Supabase Realtime on the `messages` table and invalidate
 * the relevant React Query caches when a change arrives. Invalidation
 * (instead of merging payloads) keeps cache reconciliation simple.
 */
export function useMessagesRealtime({ campaignId, additionalKeys }: Options = {}) {
    const queryClient = useQueryClient()

    useEffect(() => {
        const channelName = campaignId
            ? `messages:campaign:${campaignId}`
            : `messages:all`

        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'messages',
                    ...(campaignId ? { filter: `campaign_id=eq.${campaignId}` } : {}),
                },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['messages'] })
                    queryClient.invalidateQueries({ queryKey: ['campaign-stats'] })
                    if (campaignId) {
                        queryClient.invalidateQueries({ queryKey: ['messages', campaignId] })
                        queryClient.invalidateQueries({ queryKey: ['campaign-stats', campaignId] })
                    }
                    queryClient.invalidateQueries({ queryKey: ['get-campaigns'] })
                    additionalKeys?.forEach((key) =>
                        queryClient.invalidateQueries({ queryKey: key as unknown[] })
                    )
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [campaignId, queryClient, additionalKeys])
}
