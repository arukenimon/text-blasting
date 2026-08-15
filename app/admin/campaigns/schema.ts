import * as z from 'zod'

export const CreateCampaignSchema = z.object({
    campaign_name: z.string().min(3, 'Campaign name must be at least 3 characters long'),
    segment_id: z.preprocess(
        (value) => value === null || value === '' ? undefined : value,
        z.string().optional()
    ),
    contact_ids: z.array(z.string().uuid()).default([]),
    message_mode: z.enum(['template', 'custom']).default('template'),
    template_id: z.preprocess(
        (value) => value === null || value === '' ? undefined : value,
        z.string().optional()
    ),
    message_body: z.preprocess(
        (value) => typeof value === 'string' ? value.trim() : value,
        z.string().optional()
    ),
    send_immediately: z.string().optional(),
    schedule_time: z.string().optional(),
}).refine(
    (data) => !!data.segment_id || data.contact_ids.length > 0,
    { message: 'Audience is required', path: ['segment_id'] }
).refine(
    (data) => data.message_mode !== 'template' || !!data.template_id,
    { message: 'Template is required', path: ['template_id'] }
).refine(
    (data) => data.message_mode !== 'custom' || !!data.message_body,
    { message: 'Message is required', path: ['message_body'] }
).refine(
    (data) => data.send_immediately === 'true' || (data.schedule_time && data.schedule_time.length > 0),
    { message: 'Schedule time is required, or check "Send immediately".', path: ['schedule_time'] }
)
