'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { SignupFormSchema, SegmentFormSchema } from './schema'


const supabase = createAdminClient()
export async function add_segment(_prevState: unknown, formData: FormData) {

    // Validate form fields
    const validatedFields = SegmentFormSchema.safeParse({
        name: formData.get('name'),
        description: formData.get('description'),
        color_hex: formData.get('color'),
    })

    // If any form fields are invalid, return early
    if (!validatedFields.success) {
        return {
            success: false as const,
            errors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
        }
    }

    const { data, error } = await supabase.from('segments').insert({
        name: validatedFields.data.name,
        description: validatedFields.data.description,
        color_hex: validatedFields.data.color_hex,
    })

    // console.log('Validated fields:', validatedFields.data)

    return { success: true as const, errors: {} as Record<string, string[]> }
}

export async function add_contact(_prevState: unknown, formData: FormData) {
    // Validate form fields
    const validatedFields = SignupFormSchema.safeParse({
        name: formData.get('name'),
        phone_no: formData.get('phone_no'),
        segment: formData.get('segment'),
    })

    // If any form fields are invalid, return early
    if (!validatedFields.success) {
        return {
            success: false as const,
            errors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
        }
    }

    const { data, error } = await supabase.from('contacts').insert({
        full_name: validatedFields.data.name,
        phone_no: validatedFields.data.phone_no,
        status: 'active',
        segment_id: validatedFields.data.segment,
    })

    console.log('Validated fields:', validatedFields.data)

    await supabase.from('segments')

    if (error) {
        console.error('Supabase insert error:', error)
        return { success: false as const, errors: { form: [error.message] } as Record<string, string[]> }
    }

    return { success: true as const, errors: {} as Record<string, string[]> }
}