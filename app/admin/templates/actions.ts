'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { CreateTemplateSchema } from './schema'
import { requireWorkspaceRole } from '@/lib/workspaces/server'


export async function add_template(_prevState: unknown, formData: FormData) {
    const supabase = createAdminClient()
    let context
    try {
        context = await requireWorkspaceRole('admin')
    } catch (err) {
        return {
            success: false as const,
            errors: { form: [err instanceof Error ? err.message : 'Not authorized.'] },
        }
    }

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

    const { error } = await supabase.from('templates').insert({
        workspace_id: context.workspace.id,
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

    return { success: true as const, errors: {} as Record<string, string[]> }
}

export async function update_template(id: string, formData: FormData) {
    const supabase = createAdminClient()
    let context
    try {
        context = await requireWorkspaceRole('admin')
    } catch (err) {
        return {
            success: false as const,
            errors: { form: [err instanceof Error ? err.message : 'Not authorized.'] },
        }
    }

    const validatedFields = CreateTemplateSchema.safeParse({
        template_name: formData.get('template_name'),
        template_body: formData.get('template_body'),
        category: formData.get('category'),
    })

    if (!validatedFields.success) {
        return {
            success: false as const,
            errors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
        }
    }

    const { error } = await supabase.from('templates').update({
        template_name: validatedFields.data.template_name,
        body: validatedFields.data.template_body,
        category: validatedFields.data.category,
    })
        .eq('id', id)
        .eq('workspace_id', context.workspace.id)

    if (error) {
        console.error('Error updating template:', error)
        return {
            success: false as const,
            errors: { form: ['An error occurred while updating the template. Please try again.'] },
        }
    }

    return { success: true as const, errors: {} as Record<string, string[]> }
}

export async function delete_template(id: string) {
    const supabase = createAdminClient()
    let context
    try {
        context = await requireWorkspaceRole('admin')
    } catch (err) {
        return { success: false as const, error: err instanceof Error ? err.message : 'Not authorized' }
    }

    const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', id)
        .eq('workspace_id', context.workspace.id)

    if (error) {
        console.error('Error deleting template:', error)
        return { success: false as const, error: error.message }
    }

    return { success: true as const }
}
