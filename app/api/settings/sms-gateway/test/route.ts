import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GatewayNotConfiguredError, getGatewayClientForUser } from '@/lib/sms-gateway'

export const runtime = 'nodejs'

/** Verifies that the saved credentials can reach the gateway. */
export async function POST() {
    const session = await createClient()
    const { data: { user } } = await session.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    try {
        const { client, profile } = await getGatewayClientForUser(user.id)
        const result = await client.ping()
        return NextResponse.json({ mode: profile.mode, ...result })
    } catch (err) {
        if (err instanceof GatewayNotConfiguredError) {
            return NextResponse.json({ ok: false, error: err.message }, { status: 400 })
        }
        return NextResponse.json(
            { ok: false, error: err instanceof Error ? err.message : 'unknown' },
            { status: 500 }
        )
    }
}
