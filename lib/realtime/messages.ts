import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

type Options = {
    /** When provided, only listen to changes in the active workspace. */
    workspaceId?: string | null
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
export function useMessagesRealtime({ workspaceId, campaignId, additionalKeys }: Options = {}) {
    const queryClient = useQueryClient()

    useEffect(() => {
        if (!workspaceId && !campaignId) return

        const channelName = campaignId
            ? `messages:campaign:${campaignId}`
            : `messages:workspace:${workspaceId}`

        const filter = campaignId
            ? `campaign_id=eq.${campaignId}`
            : `workspace_id=eq.${workspaceId}`

        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'messages',
                    filter,
                },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['messages', workspaceId] })
                    queryClient.invalidateQueries({ queryKey: ['campaign-stats', workspaceId] })
                    queryClient.invalidateQueries({ queryKey: ['dashboard-stats', workspaceId] })
                    if (campaignId) {
                        queryClient.invalidateQueries({ queryKey: ['messages', campaignId] })
                        queryClient.invalidateQueries({ queryKey: ['campaign-stats', campaignId] })
                    }
                    queryClient.invalidateQueries({ queryKey: ['get-campaigns', workspaceId] })
                    additionalKeys?.forEach((key) =>
                        queryClient.invalidateQueries({ queryKey: key as unknown[] })
                    )
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [workspaceId, campaignId, queryClient, additionalKeys])
}
