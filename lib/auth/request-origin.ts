import type { NextRequest } from 'next/server'

function firstHeaderValue(value: string | null) {
    return value?.split(',')[0]?.trim() || null
}

export function getRequestOrigin(request: NextRequest) {
    const host =
        firstHeaderValue(request.headers.get('x-forwarded-host')) ??
        firstHeaderValue(request.headers.get('host'))
    const protocol =
        firstHeaderValue(request.headers.get('x-forwarded-proto')) ??
        request.nextUrl.protocol.replace(':', '')

    return host ? `${protocol}://${host}` : request.nextUrl.origin
}

export function getRequestUrl(request: NextRequest, path: string) {
    return new URL(path, getRequestOrigin(request))
}
