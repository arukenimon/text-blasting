'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { PASSWORD_RECOVERY_ACCESS_COOKIE, PASSWORD_RECOVERY_COOKIE } from '@/lib/auth/recovery'
import { createAdminClient, createClient } from '@/lib/supabase/server'

type ResetPasswordResult = {
    success: boolean
    errors: Record<string, string[]>
}

export async function reset_password(
    _prevState: unknown,
    formData: FormData
): Promise<ResetPasswordResult> {
    const cookieStore = await cookies()
    const recoveryAccessToken = cookieStore.get(PASSWORD_RECOVERY_ACCESS_COOKIE)?.value
    if (!cookieStore.get(PASSWORD_RECOVERY_COOKIE)) {
        return { success: false, errors: { form: ['Open the password reset email again to continue.'] } }
    }

    const admin = createAdminClient()
    const { data: { user: recoveryUser } } = recoveryAccessToken
        ? await admin.auth.getUser(recoveryAccessToken)
        : { data: { user: null } }
    const supabase = await createClient()
    const { data: { user: sessionUser } } = await supabase.auth.getUser()
    const user = recoveryUser ?? sessionUser
    if (!user) {
        return { success: false, errors: { form: ['Open the password reset email again to continue.'] } }
    }

    const password = String(formData.get('password') ?? '')
    const confirmPassword = String(formData.get('confirm_password') ?? '')

    if (password.length < 8) {
        return { success: false, errors: { password: ['Password must be at least 8 characters.'] } }
    }
    if (password !== confirmPassword) {
        return { success: false, errors: { confirm_password: ['Passwords do not match.'] } }
    }

    const { error } = await admin.auth.admin.updateUserById(user.id, { password })
    if (error) {
        return { success: false, errors: { form: [error.message] } }
    }

    cookieStore.delete(PASSWORD_RECOVERY_COOKIE)
    cookieStore.delete(PASSWORD_RECOVERY_ACCESS_COOKIE)
    await supabase.auth.signOut()

    redirect('/login?message=password-updated')
}
