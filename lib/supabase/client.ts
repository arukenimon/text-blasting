import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!; // ! means that we are asserting that this value is not null or undefined
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // This is the public anon key, which is safe to use in client-side code.

export const supabase = createClient(supabaseUrl, supabaseAnonKey)