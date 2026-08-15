import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { chunkPhoneNumbers, getGatewayClientForWorkspace, sleep } from '@/lib/sms-gateway'
import { requireWorkspaceRole } from '@/lib/workspaces/server'

export const runtime = 'nodejs'
export const maxDuration = 60 // Vercel Hobby max

// contacts.phone_no is stored as a bigint in the existing schema (sigh) —
// coerce to string everywhere we use it.
type RawContact = {
    id: string
    workspace_id?: string | null
    full_name: string | null
    phone_no: number | string | null
    status?: string | null
}
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
    let workspaceId: string | null = null
    let isCron = false
    const cronToken = request.headers.get('authorization')
    if (cronToken && process.env.CRON_SECRET && cronToken === `Bearer ${process.env.CRON_SECRET}`) {
        isCron = true
        userId = request.headers.get('x-cron-user')
        workspaceId = request.headers.get('x-cron-workspace')
    } else {
        try {
            const context = await requireWorkspaceRole('member')
            userId = context.userId
            workspaceId = context.workspace.id
        } catch {
            const session = await createClient()
            const { data: { user } } = await session.auth.getUser()
            userId = user?.id ?? null
        }
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
        workspace_id: string
        user_id: string | null
        status: string
        message_body: string | null
        contact_ids: string[] | null
        templates: { id: string; template_name: string; body: string } | { id: string; template_name: string; body: string }[] | null
        segments:
            | { id: string; name: string; workspace_id: string; contacts: (RawContact & { workspace_id?: string | null })[] }
            | { id: string; name: string; workspace_id: string; contacts: (RawContact & { workspace_id?: string | null })[] }[]
            | null
    }
    const { data: campaignRaw, error: campaignErr } = await admin
        .from('campaigns')
        .select(
            'id, workspace_id, campaign_name, segment_id, template_id, status, user_id, message_body, ' +
            'contact_ids, ' +
            'templates(id, template_name, body), ' +
            'segments(id, name, workspace_id, contacts(id, workspace_id, full_name, phone_no, status))'
        )
        .eq('id', campaignIdNum)
        .single()
    const campaign = campaignRaw as unknown as CampaignWithRelations | null

    if (campaignErr || !campaign) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }
    if (!isCron && campaign.workspace_id !== workspaceId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (isCron && workspaceId && workspaceId !== campaign.workspace_id) {
        return NextResponse.json({ error: 'Cron workspace does not match campaign' }, { status: 400 })
    }
    workspaceId = workspaceId ?? campaign.workspace_id
    if (!workspaceId) {
        return NextResponse.json({ error: 'Campaign has no workspace_id' }, { status: 400 })
    }
    if (campaign.status === 'Running' || campaign.status === 'Completed') {
        return NextResponse.json(
            { error: `Campaign is already ${campaign.status}` },
            { status: 409 }
        )
    }

    const template = Array.isArray(campaign.templates) ? campaign.templates[0] : campaign.templates
    const segment = Array.isArray(campaign.segments) ? campaign.segments[0] : campaign.segments
    if (segment?.workspace_id && segment.workspace_id !== campaign.workspace_id) {
        return NextResponse.json({ error: 'Campaign segment belongs to another workspace' }, { status: 400 })
    }
    const messageBody = campaign.message_body?.trim() || template?.body || ''
    if (!messageBody) {
        return NextResponse.json({ error: 'Message missing or empty' }, { status: 400 })
    }

    const selectedContactIds = Array.isArray(campaign.contact_ids) ? campaign.contact_ids : []
    let contactRows: RawContact[] = []

    if (selectedContactIds.length > 0) {
        const { data: selectedContacts, error: selectedContactsErr } = await admin
            .from('contacts')
            .select('id, workspace_id, full_name, phone_no, status')
            .eq('workspace_id', campaign.workspace_id)
            .in('id', selectedContactIds)

        if (selectedContactsErr) {
            return NextResponse.json({ error: selectedContactsErr.message }, { status: 400 })
        }
        contactRows = selectedContacts ?? []
    } else {
        contactRows = (segment?.contacts ?? []).filter(
            (c) => !c.workspace_id || c.workspace_id === campaign.workspace_id
        )
    }

    const allContacts: Contact[] = contactRows
        .filter((c) => c.status !== 'Opted Out')
        .map(normalizeContact)
        .filter((c) => c.phone_no.length > 0)

    if (allContacts.length === 0) {
        await admin.from('campaigns').update({ status: 'Completed', completed_at: new Date().toISOString() }).eq('id', campaignIdNum)
        return NextResponse.json({ ok: true, sent: 0, message: 'No contacts in audience' })
    }

    const claimed = await claimCampaignForSending(admin, campaignIdNum, userId)
    if (!claimed) {
        return NextResponse.json(
            { error: 'Campaign is already running or completed' },
            { status: 409 }
        )
    }

    // ── Load gateway client for this user ──────────────────────────────────
    let gateway, profile
    try {
        const out = await getGatewayClientForWorkspace(workspaceId!)
        gateway = out.client
        profile = out.profile
    } catch (err) {
        await admin.from('campaigns').update({ status: 'Failed' }).eq('id', campaignIdNum)
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Gateway not configured' },
            { status: 400 }
        )
    }

    const gatewayHealth = await gateway.checkCloudDeviceHealth()
    if (!gatewayHealth.ok) {
        await admin.from('campaigns').update({ status: 'Failed' }).eq('id', campaignIdNum)
        return NextResponse.json(
            {
                error: gatewayHealth.error ?? 'No recently active SMS Gateway sender device found.',
                gateway: gatewayHealth,
            },
            { status: 400 }
        )
    }

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
                workspace_id: workspaceId!,
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

        await sleep(200)
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

async function claimCampaignForSending(
    admin: ReturnType<typeof createAdminClient>,
    campaignId: number,
    userId: string
) {
    const { data, error } = await admin
        .from('campaigns')
        .update({
            status: 'Running',
            started_at: new Date().toISOString(),
            completed_at: null,
            user_id: userId,
        })
        .eq('id', campaignId)
        .neq('status', 'Running')
        .neq('status', 'Completed')
        .select('id')
        .maybeSingle()

    if (error) {
        throw new Error(error.message)
    }

    return Boolean(data)
}
