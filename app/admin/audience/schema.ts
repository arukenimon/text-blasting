import * as z from 'zod'

export const SignupFormSchema = z.object({
    name: z
        .string()
        .min(2, { error: 'Name must be at least 2 characters long.' })
        .trim(),
    phone_no: z.string()
        .min(7, { error: 'Phone number must be at least 7 digits long.' })
        .regex(/^\d+$/, { error: 'Phone number must contain only digits.' })
        .trim(),
    segment: z.string().min(1, { error: 'Please select a segment.' }),
    new_segment_name: z.string().optional(),
    new_segment_description: z.string().optional(),
    new_segment_color: z.string().optional(),
})

export const SegmentFormSchema = z.object({
    name: z
        .string()
        .min(2, { error: 'Segment name must be at least 2 characters long.' })
        .trim(),
    description: z.string().optional(),
    color_hex: z.string()
        .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, { error: 'Invalid hex color code.' })
        .trim()
})
