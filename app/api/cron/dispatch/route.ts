import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * Vercel Cron-triggered dispatcher.
 * Picks up campaigns where status='Scheduled' and scheduled_date <= now(),
 * and POSTs to the campaign send endpoint for each (server-to-server, authenticated
 * via CRON_SECRET + x-cron-user + x-cron-workspace).
 */
export async function GET(request: NextRequest) {
    return handleDispatch(request)
}
export async function POST(request: NextRequest) {
    return handleDispatch(request)
}

async function handleDispatch(request: NextRequest) {
    if (!process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
    }
    const auth = request.headers.get('authorization') ?? ''
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()
    const { data: dueCampaigns, error } = await admin
        .from('campaigns')
        .select('id, workspace_id, user_id, scheduled_date, status')
        .eq('status', 'Scheduled')
        .lte('scheduled_date', new Date().toISOString())
        .limit(20)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!dueCampaigns || dueCampaigns.length === 0) {
        return NextResponse.json({ dispatched: 0 })
    }

    const origin = request.nextUrl.origin
    const results: { id: string; ok: boolean; status?: number; error?: string }[] = []

    for (const c of dueCampaigns) {
        if (!c.user_id) {
            results.push({ id: c.id, ok: false, error: 'Campaign has no user_id' })
            continue
        }
        if (!c.workspace_id) {
            results.push({ id: c.id, ok: false, error: 'Campaign has no workspace_id' })
            continue
        }
        try {
            const res = await fetch(`${origin}/api/campaigns/${c.id}/send`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${process.env.CRON_SECRET}`,
                    'x-cron-user': c.user_id,
                    'x-cron-workspace': c.workspace_id,
                    'Content-Type': 'application/json',
                },
            })
            results.push({ id: c.id, ok: res.ok, status: res.status })
        } catch (err) {
            results.push({
                id: c.id,
                ok: false,
                error: err instanceof Error ? err.message : 'fetch failed',
            })
        }
    }

    return NextResponse.json({ dispatched: results.length, results })
}
