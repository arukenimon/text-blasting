'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { CreateCampaignSchema } from './schema'


export async function add_campaign(_prevState: unknown, formData: FormData) {
    const supabase = createAdminClient()

    // Validate form fields
    const validatedFields = CreateCampaignSchema.safeParse({
        campaign_name: formData.get('campaign_name'),
        segment_id: formData.get('segment_id'),
        template_id: formData.get('template_id'),
        send_immediately: formData.get('send_immediately') ?? undefined,
        schedule_time: formData.get('schedule_time') ?? undefined,
    })

    console.log('Validated fields:', validatedFields.data)

    // If any form fields are invalid, return early
    if (!validatedFields.success) {
        return {
            success: false as const,
            errors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
        }
    }


    const { data, error } = await supabase.from('campaigns').insert({
        campaign_name: validatedFields.data.campaign_name,
        segment_id: validatedFields.data.segment_id,
        template_id: validatedFields.data.template_id,
        scheduled_date: validatedFields.data.send_immediately === 'true' ? new Date() : new Date(validatedFields.data.schedule_time!),
    })

    if (error) {
        console.error('Error inserting campaign:', error)
        return {
            success: false as const,
            errors: { form: ['An error occurred while saving the campaign. Please try again.'] },
        }
    }

    // console.log('Validated fields:', validatedFields.data)

    return { success: true as const, errors: {} as Record<string, string[]> }
}
