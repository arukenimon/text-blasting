'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { CreateTemplateSchema } from './schema'


export async function add_template(_prevState: unknown, formData: FormData) {
    const supabase = createAdminClient()

    // Validate form fields
    const validatedFields = CreateTemplateSchema.safeParse({
        template_name: formData.get('template_name'),
        template_body: formData.get('template_body'),
        category: formData.get('category'),
    })

    // If any form fields are invalid, return early
    if (!validatedFields.success) {
        return {
            success: false as const,
            errors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
        }
    }

    console.log('Validated fields:', validatedFields.data)

    const { data, error } = await supabase.from('templates').insert({
        template_name: validatedFields.data.template_name,
        body: validatedFields.data.template_body,
        category: validatedFields.data.category,
    })

    if (error) {
        console.error('Error inserting template:', error)
        return {
            success: false as const,
            errors: { form: ['An error occurred while saving the template. Please try again.'] },
        }
    }

    // console.log('Validated fields:', validatedFields.data)

    return { success: true as const, errors: {} as Record<string, string[]> }
}
