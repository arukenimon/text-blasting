import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createAuthEmailClient() {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: {
                flowType: 'implicit',
                autoRefreshToken: false,
                persistSession: false,
                detectSessionInUrl: false,
            },
        }
    )
}
