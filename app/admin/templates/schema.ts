import * as z from 'zod'

export const CreateTemplateSchema = z.object({
    template_name: z.string()
        .min(2, { error: 'Template name must be at least 2 characters long.' })
        .trim(),
    template_body: z.string()
        .min(5, { error: 'Content must be at least 5 characters long.' })
        .trim(),
    category: z.string().min(1, { error: 'Please select a category.' })
})
