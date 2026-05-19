'use server'

import { headers } from 'next/headers'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { CreateCampaignSchema } from './schema'

async function getCurrentUserId(): Promise<string | null> {
    const session = await createClient()
    const { data: { user } } = await session.auth.getUser()
    return user?.id ?? null
}

export async function add_campaign(_prevState: unknown, formData: FormData) {
    const supabase = createAdminClient()

    const validatedFields = CreateCampaignSchema.safeParse({
        campaign_name: formData.get('campaign_name'),
        segment_id: formData.get('segment_id'),
        template_id: formData.get('template_id'),
        send_immediately: formData.get('send_immediately') ?? undefined,
        schedule_time: formData.get('schedule_time') ?? undefined,
    })

    if (!validatedFields.success) {
        return {
            success: false as const,
            errors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
        }
    }

    const userId = await getCurrentUserId()
    if (!userId) {
        return {
            success: false as const,
            errors: { form: ['Not authenticated.'] } as Record<string, string[]>,
        }
    }

    const sendImmediately = validatedFields.data.send_immediately === 'true'
    const scheduledDate = sendImmediately
        ? new Date()
        : new Date(validatedFields.data.schedule_time!)
    const status: 'Scheduled' | 'Draft' = sendImmediately || scheduledDate > new Date()
        ? 'Scheduled'
        : 'Draft'

    const { data: campaign, error } = await supabase
        .from('campaigns')
        .insert({
            campaign_name: validatedFields.data.campaign_name,
            segment_id: validatedFields.data.segment_id,
            template_id: validatedFields.data.template_id,
            scheduled_date: scheduledDate.toISOString(),
            user_id: userId,
            status,
        })
        .select('id')
        .single()

    if (error || !campaign) {
        return {
            success: false as const,
            errors: { form: [error?.message ?? 'Failed to save campaign'] } as Record<string, string[]>,
        }
    }

    // If user picked "Send immediately", fire it right away.
    if (sendImmediately) {
        try {
            await invokeCampaignSend(campaign.id)
        } catch (err) {
            console.error('[add_campaign] immediate dispatch failed', err)
            return {
                success: true as const,
                errors: {
                    _dispatch: [
                        'Campaign saved but immediate dispatch failed: ' +
                            (err instanceof Error ? err.message : 'unknown'),
                    ],
                } as Record<string, string[]>,
            }
        }
    }

    return { success: true as const, errors: {} as Record<string, string[]> }
}

export async function update_campaign(id: string | number, formData: FormData) {
    const supabase = createAdminClient()

    const validatedFields = CreateCampaignSchema.safeParse({
        campaign_name: formData.get('campaign_name'),
        segment_id: formData.get('segment_id'),
        template_id: formData.get('template_id'),
        send_immediately: formData.get('send_immediately') ?? undefined,
        schedule_time: formData.get('schedule_time') ?? undefined,
    })

    if (!validatedFields.success) {
        return {
            success: false as const,
            errors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
        }
    }

    const sendImmediately = validatedFields.data.send_immediately === 'true'
    const scheduledDate = sendImmediately
        ? new Date()
        : new Date(validatedFields.data.schedule_time!)

    const { error } = await supabase
        .from('campaigns')
        .update({
            campaign_name: validatedFields.data.campaign_name,
            segment_id: validatedFields.data.segment_id,
            template_id: validatedFields.data.template_id,
            scheduled_date: scheduledDate.toISOString(),
        })
        .eq('id', id)

    if (error) {
        return {
            success: false as const,
            errors: { form: [error.message] } as Record<string, string[]>,
        }
    }
    return { success: true as const, errors: {} as Record<string, string[]> }
}

export async function send_campaign(id: string | number): Promise<{ ok: boolean; error?: string; result?: unknown }> {
    const userId = await getCurrentUserId()
    if (!userId) return { ok: false, error: 'Not authenticated' }

    try {
        const result = await invokeCampaignSend(String(id))
        return { ok: true, result }
    } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : 'send failed' }
    }
}

async function invokeCampaignSend(campaignId: string) {
    const hdrs = await headers()
    const proto = hdrs.get('x-forwarded-proto') ?? 'https'
    const host = hdrs.get('host')
    if (!host) throw new Error('Missing host header')
    const cookie = hdrs.get('cookie') ?? ''

    const res = await fetch(`${proto}://${host}/api/campaigns/${campaignId}/send`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            cookie,
        },
        cache: 'no-store',
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
        throw new Error(body?.error ?? `Send failed (${res.status})`)
    }
    return body
}
