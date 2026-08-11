import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    const url = new URL(request.url)
    const code = url.searchParams.get('code')
    const next = url.searchParams.get('next') || '/admin/dashboard'
    const redirectUrl = new URL(next, request.url)

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
            redirectUrl.pathname = '/login'
            redirectUrl.search = ''
            redirectUrl.searchParams.set('redirectTo', next)
            redirectUrl.searchParams.set('error', error.message)
            return NextResponse.redirect(redirectUrl)
        }
    }

    return NextResponse.redirect(redirectUrl)
}
