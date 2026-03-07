import * as z from 'zod'

export const CreateCampaignSchema = z.object({
    campaign_name: z.string().min(3, 'Campaign name must be at least 3 characters long'),
    segment_id: z.string().min(1, 'Segment is required'),
    template_id: z.string().min(1, 'Template is required'),
    send_immediately: z.string().optional(),
    schedule_time: z.string().optional(),
}).refine(
    (data) => data.send_immediately === 'true' || (data.schedule_time && data.schedule_time.length > 0),
    { message: 'Schedule time is required, or check "Send immediately".', path: ['schedule_time'] }
)