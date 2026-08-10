import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { chunkPhoneNumbers, getGatewayClientForUser, sleep } from '@/lib/sms-gateway'

export const runtime = 'nodejs'
export const maxDuration = 60 // Vercel Hobby max

// contacts.phone_no is stored as a bigint in the existing schema (sigh) —
// coerce to string everywhere we use it.
type RawContact = { id: string; full_name: string | null; phone_no: number | string | null; status?: string | null }
type Contact = { id: string; full_name: string; phone_no: string }

function normalizeContact(c: RawContact): Contact {
    return {
        id: c.id,
        full_name: c.full_name ?? '',
        phone_no: c.phone_no == null ? '' : String(c.phone_no),
    }
}

function personalizeMessage(body: string, contact: Contact): string {
    return body
        .replace(/\{\{\s*full_name\s*\}\}/g, contact.full_name)
        .replace(/\{\{\s*phone_no\s*\}\}/g, contact.phone_no)
}

function normalizePhone(raw: string): string {
    const trimmed = String(raw ?? '').trim()
    if (!trimmed) return trimmed
    if (trimmed.startsWith('+')) return trimmed
    // Default country code (PH) matches the existing /campaigns page convention.
    return `+63${trimmed.replace(/^0+/, '')}`
}

/**
 * Trigger sending of a campaign. Authorization:
 *   - End-user session (admin UI "Send Now") → caller must own the campaign.
 *   - Cron dispatcher → `Authorization: Bearer ${CRON_SECRET}` + `x-cron-user` header
 *     (set by /api/cron/dispatch when invoking server-to-server).
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: campaignId } = await params

    // ── Resolve acting user ────────────────────────────────────────────────
    let userId: string | null = null
    const cronToken = request.headers.get('authorization')
    if (cronToken && process.env.CRON_SECRET && cronToken === `Bearer ${process.env.CRON_SECRET}`) {
        userId = request.headers.get('x-cron-user')
    } else {
        const session = await createClient()
        const { data: { user } } = await session.auth.getUser()
        userId = user?.id ?? null
    }
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const admin = createAdminClient()

    // ── Load campaign + template + contacts ────────────────────────────────
    // campaigns.id is bigint, so coerce the URL string to a number for the lookup.
    const campaignIdNum = Number(campaignId)
    if (!Number.isFinite(campaignIdNum)) {
        return NextResponse.json({ error: 'Invalid campaign id' }, { status: 400 })
    }

    type CampaignWithRelations = {
        id: number
        user_id: string | null
        status: string
        message_body: string | null
        templates: { id: string; template_name: string; body: string } | { id: string; template_name: string; body: string }[] | null
        segments: { id: string; name: string; contacts: RawContact[] } | { id: string; name: string; contacts: RawContact[] }[] | null
    }
    const { data: campaignRaw, error: campaignErr } = await admin
        .from('campaigns')
        .select(
            'id, campaign_name, segment_id, template_id, status, user_id, message_body, ' +
            'templates(id, template_name, body), ' +
            'segments(id, name, contacts(id, full_name, phone_no, status))'
        )
        .eq('id', campaignIdNum)
        .single()
    const campaign = campaignRaw as unknown as CampaignWithRelations | null

    if (campaignErr || !campaign) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }
    if (campaign.user_id && campaign.user_id !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (campaign.status === 'Running' || campaign.status === 'Completed') {
        return NextResponse.json(
            { error: `Campaign is already ${campaign.status}` },
            { status: 409 }
        )
    }

    const template = Array.isArray(campaign.templates) ? campaign.templates[0] : campaign.templates
    const segment = Array.isArray(campaign.segments) ? campaign.segments[0] : campaign.segments
    const messageBody = campaign.message_body?.trim() || template?.body || ''
    if (!messageBody) {
        return NextResponse.json({ error: 'Message missing or empty' }, { status: 400 })
    }

    const allContacts: Contact[] = (segment?.contacts ?? [])
        .filter((c) => c.status !== 'Opted Out')
        .map(normalizeContact)
        .filter((c) => c.phone_no.length > 0)

    if (allContacts.length === 0) {
        await admin.from('campaigns').update({ status: 'Completed', completed_at: new Date().toISOString() }).eq('id', campaignIdNum)
        return NextResponse.json({ ok: true, sent: 0, message: 'No contacts in segment' })
    }

    // ── Load gateway client for this user ──────────────────────────────────
    let gateway, profile
    try {
        const out = await getGatewayClientForUser(userId)
        gateway = out.client
        profile = out.profile
    } catch (err) {
        await admin.from('campaigns').update({ status: 'Failed' }).eq('id', campaignIdNum)
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Gateway not configured' },
            { status: 400 }
        )
    }

    // Mark campaign as Running
    await admin
        .from('campaigns')
        .update({ status: 'Running', started_at: new Date().toISOString(), user_id: userId })
        .eq('id', campaignIdNum)

    // ── For each chunk: pre-insert pending message rows, then send batch ───
    const simNumber = profile.sim_slot ?? 1
    const chunks = chunkPhoneNumbers(allContacts, profile.mode)
    let sentCount = 0
    let failedCount = 0
    const errors: { recipient: string; error: string }[] = []

    for (const chunk of chunks) {
        // Group contacts by personalized body. If everyone has identical text,
        // we send a single multi-recipient request; otherwise we send per contact.
        const groups = new Map<string, Contact[]>()
        for (const c of chunk) {
            const text = personalizeMessage(messageBody, c)
            const list = groups.get(text) ?? []
            list.push(c)
            groups.set(text, list)
        }

        for (const [text, recipients] of groups) {
            const phoneNumbers = recipients.map((r) => normalizePhone(r.phone_no))

            // Pre-insert pending rows so the UI can show them before the gateway responds
            const pendingRows = recipients.map((r, idx) => ({
                user_id: userId!,
                campaign_id: campaignIdNum,
                contact_id: r.id,
                direction: 'outbound' as const,
                phone_no: phoneNumbers[idx],
                body: text,
                status: 'pending' as const,
                sim_slot: simNumber,
            }))
            const { data: inserted } = await admin
                .from('messages')
                .insert(pendingRows)
                .select('id, contact_id')
            const insertedIds = (inserted ?? []).map((r) => r.id)

            if (insertedIds.length !== recipients.length) {
                const message = 'Failed to record every campaign recipient before sending'
                failedCount += recipients.length
                recipients.forEach((r, idx) =>
                    errors.push({ recipient: phoneNumbers[idx], error: message })
                )
                continue
            }

            try {
                const resp = await gateway.sendMessage({
                    textMessage: { text },
                    phoneNumbers,
                    simNumber,
                })

                await admin
                    .from('messages')
                    .update({
                        status: 'queued',
                        gateway_message_id: resp.id,
                    })
                    .in('id', insertedIds)
                sentCount += recipients.length
            } catch (err) {
                const message = err instanceof Error ? err.message : 'send failed'
                await admin
                    .from('messages')
                    .update({
                        status: 'failed',
                        failed_at: new Date().toISOString(),
                        error_reason: message,
                    })
                    .in('id', insertedIds)
                failedCount += recipients.length
                recipients.forEach((r, idx) =>
                    errors.push({ recipient: phoneNumbers[idx], error: message })
                )
            }
        }

        // Be a polite client; the local gateway in particular needs breathing room
        await sleep(profile.mode === 'local' ? 500 : 200)
    }

    // Final campaign status
    const finalStatus = failedCount === allContacts.length ? 'Failed' : 'Completed'
    await admin
        .from('campaigns')
        .update({ status: finalStatus, completed_at: new Date().toISOString() })
        .eq('id', campaignIdNum)

    return NextResponse.json({
        ok: failedCount < allContacts.length,
        campaign_id: campaignIdNum,
        attempted: allContacts.length,
        sent: sentCount,
        failed: failedCount,
        errors: errors.slice(0, 10),
    })
}
