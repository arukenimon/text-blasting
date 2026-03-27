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

    if (error) {
        console.error('Supabase insert error:', error)
        return { success: false as const, errors: { form: [error.message] } as Record<string, string[]> }
    }

    return { success: true as const, errors: {} as Record<string, string[]> }
}

export async function bulk_import_contacts(
    contacts: { full_name: string; phone_no: string }[],
    segment_id: string
): Promise<{ success: boolean; count?: number; error?: string }> {
    if (!segment_id) return { success: false, error: 'Segment is required' }
    if (!contacts.length) return { success: false, error: 'No contacts to import' }

    const rows = contacts.map((c) => ({
        full_name: c.full_name,
        phone_no: c.phone_no,
        segment_id,
        status: 'active',
    }))

    const { error } = await supabase.from('contacts').insert(rows)
    if (error) {
        console.error('Bulk import error:', error)
        return { success: false, error: error.message }
    }

    return { success: true, count: contacts.length }
}

export async function delete_contacts(
    ids: string[]
): Promise<{ success: boolean; error?: string }> {
    if (!ids.length) return { success: false, error: 'No contacts specified' }

    const { error } = await supabase.from('contacts').delete().in('id', ids)
    if (error) {
        console.error('Delete contacts error:', error)
        return { success: false, error: error.message }
    }

    return { success: true }
}