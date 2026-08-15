'use server'

import { headers } from 'next/headers'
import * as z from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { requireWorkspaceRole } from '@/lib/workspaces/server'

const QuickSendSchema = z.object({
    campaign_name: z.string().trim().optional(),
    segment_id: z.string().uuid('Choose an audience segment.'),
    message_body: z.string().trim().min(1, 'Enter a message.').max(160, 'Keep quick send drafts under 160 characters.'),
    intent: z.enum(['draft', 'send']),
})

export type QuickSendState = {
    success: boolean
    message?: string
    campaignId?: number
    errors: Record<string, string[]>
}

export async function quick_send_campaign(
    _prevState: QuickSendState | undefined,
    formData: FormData
): Promise<QuickSendState> {
    const parsed = QuickSendSchema.safeParse({
        campaign_name: formData.get('campaign_name'),
        segment_id: formData.get('segment_id'),
        message_body: formData.get('message_body'),
        intent: formData.get('intent'),
    })

    if (!parsed.success) {
        return {
            success: false,
            errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
        }
    }

    let context
    try {
        context = await requireWorkspaceRole('member')
    } catch (err) {
        return {
            success: false,
            errors: { form: [err instanceof Error ? err.message : 'Not authorized.'] },
        }
    }

    const supabase = createAdminClient()
    const { data: segment, error: segmentError } = await supabase
        .from('segments')
        .select('id, name')
        .eq('id', parsed.data.segment_id)
        .eq('workspace_id', context.workspace.id)
        .maybeSingle()

    if (segmentError || !segment) {
        return {
            success: false,
            errors: { segment_id: [segmentError?.message ?? 'Selected segment does not exist in this workspace.'] },
        }
    }

    const fallbackName = `Quick send to ${segment.name ?? 'segment'}`
    const campaignName = parsed.data.campaign_name?.trim() || fallbackName

    const { data: campaign, error } = await supabase
        .from('campaigns')
        .insert({
            campaign_name: campaignName,
            workspace_id: context.workspace.id,
            segment_id: segment.id,
            template_id: null,
            message_body: parsed.data.message_body,
            scheduled_date: null,
            user_id: context.userId,
            status: 'Draft',
        })
        .select('id')
        .single()

    if (error || !campaign) {
        return {
            success: false,
            errors: { form: [error?.message ?? 'Failed to save quick send draft.'] },
        }
    }

    if (parsed.data.intent === 'send') {
        try {
            await invokeCampaignSend(String(campaign.id))
        } catch (err) {
            return {
                success: false,
                campaignId: campaign.id,
                message: 'Draft saved, but sending failed.',
                errors: {
                    form: [err instanceof Error ? err.message : 'Sending failed.'],
                },
            }
        }
    }

    return {
        success: true,
        campaignId: campaign.id,
        message: parsed.data.intent === 'send' ? 'Quick send queued.' : 'Quick send draft saved.',
        errors: {},
    }
}

async function invokeCampaignSend(campaignId: string) {
    const hdrs = await headers()
    const proto = hdrs.get('x-forwarded-proto') ?? 'https'
    const host = hdrs.get('host')
    if (!host) throw new Error('Missing host header.')

    const res = await fetch(`${proto}://${host}/api/campaigns/${campaignId}/send`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            cookie: hdrs.get('cookie') ?? '',
        },
        cache: 'no-store',
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
        throw new Error(body?.error ?? `Send failed (${res.status}).`)
    }
    return body
}
