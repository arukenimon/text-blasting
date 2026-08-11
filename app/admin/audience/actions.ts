'use server'

import { createAdminClient, createClient } from '@/lib/supabase/server'
import { SignupFormSchema, SegmentFormSchema } from './schema'
import { requireWorkspaceRole } from '@/lib/workspaces/server'

const NEW_SEGMENT_VALUE = '__new_segment__'

async function createSegmentForCurrentUser(fields: {
    name: string
    description?: string
    color_hex: string
}) {
    const sessionClient = await createClient()
    return sessionClient.rpc('create_segment_for_authenticated', {
        segment_name: fields.name,
        segment_description: fields.description ?? '',
        segment_color_hex: fields.color_hex,
    })
}

async function createContactForCurrentUser(fields: {
    name: string
    phone_no: string
    segment_id: string
}) {
    const sessionClient = await createClient()
    return sessionClient.rpc('create_contact_for_authenticated', {
        contact_name: fields.name,
        contact_phone_no: fields.phone_no,
        contact_segment_id: fields.segment_id,
    })
}

export async function add_segment(_prevState: unknown, formData: FormData) {
    const validatedFields = SegmentFormSchema.safeParse({
        name: formData.get('name'),
        description: formData.get('description'),
        color_hex: formData.get('color'),
    })

    if (!validatedFields.success) {
        return {
            success: false as const,
            errors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
        }
    }

    const { error } = await createSegmentForCurrentUser({
        name: validatedFields.data.name,
        description: validatedFields.data.description,
        color_hex: validatedFields.data.color_hex,
    })

    if (error) {
        return { success: false as const, errors: { form: [error.message] } as Record<string, string[]> }
    }

    return { success: true as const, errors: {} as Record<string, string[]> }
}

export async function add_contact(_prevState: unknown, formData: FormData) {
    const validatedFields = SignupFormSchema.safeParse({
        name: formData.get('name'),
        phone_no: formData.get('phone_no'),
        segment: formData.get('segment'),
        new_segment_name: formData.get('new_segment_name') ?? undefined,
        new_segment_description: formData.get('new_segment_description') ?? undefined,
        new_segment_color: formData.get('new_segment_color') ?? undefined,
    })

    if (!validatedFields.success) {
        return {
            success: false as const,
            errors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
        }
    }

    let segmentId = validatedFields.data.segment

    if (segmentId === NEW_SEGMENT_VALUE) {
        const segmentFields = SegmentFormSchema.safeParse({
            name: validatedFields.data.new_segment_name,
            description: validatedFields.data.new_segment_description,
            color_hex: validatedFields.data.new_segment_color || '#6366f1',
        })

        if (!segmentFields.success) {
            return {
                success: false as const,
                errors: {
                    new_segment_name:
                        segmentFields.error.flatten().fieldErrors.name ??
                        segmentFields.error.flatten().fieldErrors.color_hex ??
                        ['Please enter a valid segment name.'],
                } as Record<string, string[]>,
            }
        }

        const { data: createdSegmentId, error: segmentError } = await createSegmentForCurrentUser({
            name: segmentFields.data.name,
            description: segmentFields.data.description,
            color_hex: segmentFields.data.color_hex,
        })

        if (segmentError || !createdSegmentId) {
            return {
                success: false as const,
                errors: {
                    new_segment_name: [segmentError?.message ?? 'Failed to create segment'],
                } as Record<string, string[]>,
            }
        }

        segmentId = createdSegmentId
    }

    const { error } = await createContactForCurrentUser({
        name: validatedFields.data.name,
        phone_no: validatedFields.data.phone_no,
        segment_id: segmentId,
    })

    if (error) {
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

    const supabase = createAdminClient()
    let context
    try {
        context = await requireWorkspaceRole('admin')
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Not authorized' }
    }

    const { data: segment } = await supabase
        .from('segments')
        .select('id')
        .eq('id', segment_id)
        .eq('workspace_id', context.workspace.id)
        .maybeSingle()

    if (!segment) return { success: false, error: 'Selected segment does not exist in this workspace' }

    const rows = contacts.map((c) => ({
        workspace_id: context.workspace.id,
        full_name: c.full_name,
        phone_no: c.phone_no,
        segment_id,
        status: 'active',
    }))

    const { error } = await supabase.from('contacts').insert(rows)
    if (error) return { success: false, error: error.message }

    return { success: true, count: contacts.length }
}

export async function delete_contacts(
    ids: string[]
): Promise<{ success: boolean; error?: string }> {
    if (!ids.length) return { success: false, error: 'No contacts specified' }
    const supabase = createAdminClient()
    let context
    try {
        context = await requireWorkspaceRole('admin')
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Not authorized' }
    }

    const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('workspace_id', context.workspace.id)
        .in('id', ids)
    if (error) return { success: false, error: error.message }

    return { success: true }
}

export async function move_contacts(
    ids: string[],
    segment_id: string
): Promise<{ success: boolean; error?: string }> {
    if (!ids.length) return { success: false, error: 'No contacts specified' }
    if (!segment_id) return { success: false, error: 'Segment is required' }

    const supabase = createAdminClient()
    let context
    try {
        context = await requireWorkspaceRole('admin')
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Not authorized' }
    }

    const { data: segment } = await supabase
        .from('segments')
        .select('id')
        .eq('id', segment_id)
        .eq('workspace_id', context.workspace.id)
        .maybeSingle()

    if (!segment) return { success: false, error: 'Selected segment does not exist in this workspace' }

    const { error } = await supabase
        .from('contacts')
        .update({ segment_id })
        .eq('workspace_id', context.workspace.id)
        .in('id', ids)

    if (error) return { success: false, error: error.message }

    return { success: true }
}
