import { type EmailOtpType } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import {
    PASSWORD_RECOVERY_ACCESS_COOKIE,
    PASSWORD_RECOVERY_COOKIE,
    PASSWORD_RECOVERY_MAX_AGE_SECONDS,
} from '@/lib/auth/recovery'
import { getRequestOrigin, getRequestUrl } from '@/lib/auth/request-origin'
import { createAdminClient } from '@/lib/supabase/server'
import { hasRoleAtLeast, type WorkspaceRole } from '@/lib/workspaces/server'

const EMAIL_OTP_TYPES = new Set<EmailOtpType>([
    'email',
    'email_change',
    'invite',
    'magiclink',
    'recovery',
    'signup',
])

function fallbackPathFor(type: EmailOtpType | null) {
    if (type === 'recovery') return '/reset-password'
    return '/admin/dashboard'
}

function isLocalAlias(a: URL, b: URL) {
    const localHosts = new Set(['127.0.0.1', 'localhost'])
    return localHosts.has(a.hostname) && localHosts.has(b.hostname) && a.port === b.port
}

function relativePath(url: URL) {
    return `${url.pathname}${url.search}${url.hash}`
}

function safeRedirectUrl(request: NextRequest, fallbackPath: string) {
    const target =
        request.nextUrl.searchParams.get('next') ??
        request.nextUrl.searchParams.get('redirect_to') ??
        request.nextUrl.searchParams.get('redirectTo')

    const requestOrigin = getRequestOrigin(request)
    const requestOriginUrl = new URL(requestOrigin)
    const fallback = new URL(fallbackPath, requestOrigin)
    if (!target) return fallback

    try {
        const url = new URL(target, requestOrigin)
        if (isLocalAlias(url, requestOriginUrl)) {
            return new URL(relativePath(url), requestOrigin)
        }
        if (url.origin !== requestOrigin) return fallback
        if (url.pathname === '/auth/confirm' || url.pathname === '/auth/callback') return fallback
        return url
    } catch {
        return fallback
    }
}

function successRedirect(request: NextRequest, type: EmailOtpType | 'invite_accepted', nextUrl: URL) {
    const url = getRequestUrl(request, '/auth/success')
    url.searchParams.set('type', type)
    url.searchParams.set('next', relativePath(nextUrl))
    return NextResponse.redirect(url)
}

function authErrorRedirect(request: NextRequest, message: string) {
    const url = getRequestUrl(request, '/auth/error')
    url.searchParams.set('message', message)
    return NextResponse.redirect(url)
}

function createAuthCallbackClient(request: NextRequest) {
    const cookiesToSet: {
        name: string
        value: string
        options: Parameters<NextResponse['cookies']['set']>[2]
    }[] = []

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(nextCookies) {
                    cookiesToSet.push(...nextCookies)
                },
            },
        }
    )

    return {
        supabase,
        withAuthCookies(response: NextResponse) {
            cookiesToSet.forEach(({ name, value, options }) => {
                response.cookies.set(name, value, options)
            })
            return response
        },
    }
}

async function pendingInviteRedirect(request: NextRequest, inviteToken: unknown) {
    if (typeof inviteToken !== 'string' || inviteToken.length === 0) return null

    const admin = createAdminClient()
    const { data } = await admin
        .from('workspace_invitations')
        .select('id')
        .eq('token', inviteToken)
        .eq('status', 'pending')
        .maybeSingle()

    if (!data) return null

    const url = getRequestUrl(request, '/invite/accept')
    url.searchParams.set('token', inviteToken)
    return url
}

async function pendingInviteTokenForEmail(email: string | null | undefined) {
    const normalizedEmail = email?.trim().toLowerCase()
    if (!normalizedEmail) return null

    const admin = createAdminClient()
    const { data } = await admin
        .from('workspace_invitations')
        .select('token')
        .eq('email', normalizedEmail)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(2)

    return data?.length === 1 ? data[0].token : null
}

async function acceptPendingInviteForUser({
    inviteToken,
    userEmail,
    userId,
}: {
    inviteToken: unknown
    userEmail: string | null | undefined
    userId: string
}) {
    if (typeof inviteToken !== 'string' || inviteToken.length === 0 || !userEmail || !userId) {
        return { accepted: false }
    }

    const admin = createAdminClient()
    const { data: invite } = await admin
        .from('workspace_invitations')
        .select('id, workspace_id, email, role, status, expires_at')
        .eq('token', inviteToken)
        .maybeSingle()

    if (!invite || invite.status !== 'pending') {
        return { accepted: false }
    }
    if (new Date(invite.expires_at).getTime() < Date.now()) {
        await admin.from('workspace_invitations').update({ status: 'expired' }).eq('id', invite.id)
        return { accepted: false, error: 'This invitation has expired.' }
    }
    if (invite.email.trim().toLowerCase() !== userEmail.trim().toLowerCase()) {
        return { accepted: false, error: 'This invitation was sent to a different email address.' }
    }

    const { data: existingMembership } = await admin
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', invite.workspace_id)
        .eq('user_id', userId)
        .maybeSingle()

    const existingRole = existingMembership?.role as WorkspaceRole | undefined
    const invitedRole = invite.role as WorkspaceRole
    const acceptedRole = existingRole && hasRoleAtLeast(existingRole, invitedRole)
        ? existingRole
        : invitedRole

    const { error: memberErr } = await admin.from('workspace_members').upsert({
        workspace_id: invite.workspace_id,
        user_id: userId,
        user_email: userEmail,
        role: acceptedRole,
    })
    if (memberErr) return { accepted: false, error: memberErr.message }

    const { error: inviteErr } = await admin
        .from('workspace_invitations')
        .update({
            status: 'accepted',
            accepted_by: userId,
            accepted_at: new Date().toISOString(),
        })
        .eq('id', invite.id)
    if (inviteErr) return { accepted: false, error: inviteErr.message }

    await admin
        .from('profile')
        .upsert({ id: userId, active_workspace_id: invite.workspace_id }, { onConflict: 'id' })

    const { data: userData } = await admin.auth.admin.getUserById(userId)
    const nextMetadata = { ...(userData.user?.user_metadata ?? {}) }
    if (nextMetadata.workspace_invite_token === inviteToken) {
        delete nextMetadata.workspace_invite_token
        delete nextMetadata.workspace_id
        delete nextMetadata.workspace_role
        await admin.auth.admin.updateUserById(userId, {
            user_metadata: nextMetadata,
        })
    }

    return { accepted: true }
}

export async function GET(request: NextRequest) {
    const tokenHash = request.nextUrl.searchParams.get('token_hash')
    const typeParam = request.nextUrl.searchParams.get('type')
    const type = typeParam && EMAIL_OTP_TYPES.has(typeParam as EmailOtpType)
        ? typeParam as EmailOtpType
        : null

    if (!tokenHash || !type) {
        return authErrorRedirect(request, 'This email link is missing or invalid.')
    }

    const { supabase, withAuthCookies } = createAuthCallbackClient(request)
    const { data, error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type,
    })

    if (error) {
        return authErrorRedirect(request, 'This email link is invalid or has expired.')
    }

    let targetUrl = safeRedirectUrl(request, fallbackPathFor(type))

    if (type === 'recovery') {
        targetUrl = getRequestUrl(request, '/reset-password')
        const response = NextResponse.redirect(targetUrl)
        withAuthCookies(response)
        response.cookies.set(PASSWORD_RECOVERY_COOKIE, '1', {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: PASSWORD_RECOVERY_MAX_AGE_SECONDS,
            path: '/',
        })
        if (data.session?.access_token) {
            response.cookies.set(PASSWORD_RECOVERY_ACCESS_COOKIE, data.session.access_token, {
                httpOnly: true,
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
                maxAge: PASSWORD_RECOVERY_MAX_AGE_SECONDS,
                path: '/',
            })
        }
        return response
    }

    if (type === 'invite') {
        const { data: { user } } = await supabase.auth.getUser()
        const inviteToken = user?.user_metadata?.workspace_invite_token
        if (typeof inviteToken === 'string' && inviteToken.length > 0) {
            const completeUrl = getRequestUrl(request, '/invite/complete')
            completeUrl.searchParams.set('token', inviteToken)
            return withAuthCookies(NextResponse.redirect(completeUrl))
        }
        return withAuthCookies(successRedirect(request, type, targetUrl))
    }

    if (type === 'magiclink') {
        const { data: { user } } = await supabase.auth.getUser()
        const userInviteToken = user?.user_metadata?.workspace_invite_token
        const inviteToken =
            typeof userInviteToken === 'string' && userInviteToken.length > 0
                ? userInviteToken
                : await pendingInviteTokenForEmail(user?.email)
        const accepted = await acceptPendingInviteForUser({
            inviteToken,
            userEmail: user?.email,
            userId: user?.id ?? '',
        })

        if (accepted.error) {
            return authErrorRedirect(request, accepted.error)
        }
        if (accepted.accepted) {
            return withAuthCookies(successRedirect(request, 'invite_accepted', getRequestUrl(request, '/admin/settings')))
        }

        if (targetUrl.pathname === '/') {
            targetUrl = await pendingInviteRedirect(request, inviteToken) ?? targetUrl
        }
    }

    if ((type === 'email' || type === 'signup') && targetUrl.pathname === '/invite/accept') {
        return withAuthCookies(NextResponse.redirect(targetUrl))
    }

    if (type === 'email' || type === 'signup' || type === 'email_change' || type === 'magiclink') {
        return withAuthCookies(successRedirect(request, type, targetUrl))
    }

    return withAuthCookies(NextResponse.redirect(targetUrl))
}
