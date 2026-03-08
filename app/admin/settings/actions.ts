'use server'

import { createAdminClient, createClient } from '@/lib/supabase/server'
import { PasswordSchema, SmsGatewaySchema } from './schema'

type ActionResult = {
    success: boolean
    errors: Record<string, string[]>
}

const supabase = createAdminClient()

async function getCurrentUserId(): Promise<string | null> {
    const sessionClient = await createClient()
    const { data: { user } } = await sessionClient.auth.getUser()
    return user?.id ?? null
}

export async function update_password(_prevState: unknown, formData: FormData): Promise<ActionResult> {
    const validated = PasswordSchema.safeParse({
        password: formData.get('password'),
        confirm_password: formData.get('confirm_password'),
    })

    if (!validated.success) {
        return { success: false, errors: validated.error.flatten().fieldErrors as Record<string, string[]> }
    }

    if (validated.data.password !== validated.data.confirm_password) {
        return { success: false, errors: { confirm_password: ['Passwords do not match.'] } }
    }

    const userId = await getCurrentUserId()
    if (!userId) return { success: false, errors: { _: ['Not authenticated.'] } }

    const { error } = await supabase.auth.admin.updateUserById(userId, {
        password: validated.data.password,
    })
    if (error) return { success: false, errors: { _: [error.message] } }

    return { success: true, errors: {} }
}

export async function update_sms_gateway(_prevState: unknown, formData: FormData): Promise<ActionResult> {
    const validated = SmsGatewaySchema.safeParse({
        local_address: formData.get('local_address'),
        public_address: formData.get('public_address'),
        local_username: formData.get('local_username'),
        local_password: formData.get('local_password'),
        cloud_address: formData.get('cloud_address'),
        cloud_username: formData.get('cloud_username'),
        cloud_password: formData.get('cloud_password'),
    })

    if (!validated.success) {
        return { success: false, errors: validated.error.flatten().fieldErrors as Record<string, string[]> }
    }

    const userId = await getCurrentUserId()
    if (!userId) return { success: false, errors: { _: ['Not authenticated.'] } }

    const { local_address, public_address, local_username, local_password, cloud_address, cloud_username, cloud_password } = validated.data

    const { error } = await supabase
        .from('profile')
        .upsert(
            {
                id: userId,
                local_server: { local_address, public_address, username: local_username, password: local_password },
                cloud_server: { server_address: cloud_address, username: cloud_username, password: cloud_password },
            },
            { onConflict: 'id' }
        )
    if (error) return { success: false, errors: { _: [error.message] } }

    return { success: true, errors: {} }
}
