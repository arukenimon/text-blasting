import { NextRequest, NextResponse } from 'next/server'
import { getRequestOrigin, getRequestUrl } from '@/lib/auth/request-origin'
import { createClient } from '@/lib/supabase/server'

function isLocalAlias(a: URL, b: URL) {
    const localHosts = new Set(['127.0.0.1', 'localhost'])
    return localHosts.has(a.hostname) && localHosts.has(b.hostname) && a.port === b.port
}

function safeRedirectUrl(request: NextRequest, fallbackPath = '/admin/dashboard') {
    const next = request.nextUrl.searchParams.get('next')
    const requestOrigin = getRequestOrigin(request)
    const requestOriginUrl = new URL(requestOrigin)
    const fallback = new URL(fallbackPath, requestOrigin)
    if (!next) return fallback

    try {
        const url = new URL(next, requestOrigin)
        if (isLocalAlias(url, requestOriginUrl)) {
            return new URL(`${url.pathname}${url.search}${url.hash}`, requestOrigin)
        }
        if (url.origin !== requestOrigin) return fallback
        if (url.pathname === '/auth/confirm' || url.pathname === '/auth/callback') return fallback
        return url
    } catch {
        return fallback
    }
}

export async function GET(request: NextRequest) {
    const url = request.nextUrl
    const code = url.searchParams.get('code')
    const redirectUrl = safeRedirectUrl(request)

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
            const loginUrl = getRequestUrl(request, '/login')
            loginUrl.searchParams.set('redirectTo', redirectUrl.pathname + redirectUrl.search)
            loginUrl.searchParams.set('error', error.message)
            return NextResponse.redirect(loginUrl)
        }
    }

    return NextResponse.redirect(redirectUrl)
}
