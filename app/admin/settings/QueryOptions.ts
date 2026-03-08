import { supabase } from '@/lib/supabase/client'
import { queryOptions } from '@tanstack/react-query'

export const getProfileOption = () => queryOptions({
    queryKey: ['profile'],
    queryFn: async () => {
        const { data, error } = await supabase
            .from('profile')
            .select('local_server, cloud_server')
            .single()
        if (error) throw new Error(error.message)
        return data ?? null
    },
})
