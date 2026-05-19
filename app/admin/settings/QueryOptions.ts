import { supabase } from '@/lib/supabase/client'
import { queryOptions } from '@tanstack/react-query'

export const getProfileOption = () =>
    queryOptions({
        queryKey: ['profile'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('profile')
                .select('mode, local_server, cloud_server, sim_slot, webhook_token, webhook_registrations')
                .single()
            if (error) throw new Error(error.message)
            return data ?? null
        },
    })
