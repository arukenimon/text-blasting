import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { GatewayNotConfiguredError, getGatewayClientForUser } from '@/lib/sms-gateway'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST() {
    const session = await createClient()
    const { data: { user } } = await session.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    let gateway
    try {
        ({ client: gateway } = await getGatewayClientForUser(user.id))
    } catch (err) {
        if (err instanceof GatewayNotConfiguredError) {
            return NextResponse.json({ error: err.message }, { status: 400 })
        }
        throw err
    }

    const deleted = await gateway.clearAllWebhooks().catch(() => 0)

    const admin = createAdminClient()
    await admin.from('profile').update({ webhook_registrations: {} }).eq('id', user.id)

    return NextResponse.json({ success: true, deleted })
}
