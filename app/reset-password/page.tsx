import { cookies } from 'next/headers'
import Link from 'next/link'
import { KeyRound, ShieldCheck } from 'lucide-react'
import { PASSWORD_RECOVERY_ACCESS_COOKIE, PASSWORD_RECOVERY_COOKIE } from '@/lib/auth/recovery'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ResetPasswordForm } from './reset-password-form'

export default async function ResetPasswordPage() {
    const cookieStore = await cookies()
    const hasRecoveryCookie = Boolean(cookieStore.get(PASSWORD_RECOVERY_COOKIE))
    const recoveryAccessToken = cookieStore.get(PASSWORD_RECOVERY_ACCESS_COOKIE)?.value
    const admin = createAdminClient()
    const { data: { user: recoveryUser } } = recoveryAccessToken
        ? await admin.auth.getUser(recoveryAccessToken)
        : { data: { user: null } }
    const supabase = await createClient()
    const { data: { user: sessionUser } } = await supabase.auth.getUser()
    const canReset = hasRecoveryCookie && Boolean(recoveryUser ?? sessionUser)

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_20%_10%,rgba(20,184,166,0.18),transparent_28%),linear-gradient(135deg,#f8fafc_0%,#eef6f5_48%,#f5f7fb_100%)] p-4 text-foreground">
            <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl items-center gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                <section className="hidden min-h-[600px] flex-col justify-between rounded-lg border border-white/60 bg-[linear-gradient(145deg,rgba(15,23,42,0.96),rgba(21,94,117,0.88))] p-8 text-white shadow-2xl shadow-slate-900/[0.12] lg:flex">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="flex size-11 items-center justify-center rounded-lg bg-emerald-300 text-sm font-black text-slate-950">
                                RC
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-100/70">
                                    Account recovery
                                </p>
                                <h1 className="text-xl font-semibold">Relay Campaigns</h1>
                            </div>
                        </div>

                        <div className="mt-14 max-w-xl">
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-200/75">
                                Verified token
                            </p>
                            <h2 className="mt-3 text-4xl font-semibold tracking-tight">
                                Set a new password for your account.
                            </h2>
                            <p className="mt-4 text-base leading-7 text-slate-200/78">
                                This page only accepts sessions created by a valid recovery email.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="mx-auto w-full max-w-md">
                    <Card className="border-white/70 bg-white/[0.92] shadow-xl shadow-slate-900/[0.08] backdrop-blur">
                        <CardContent className="p-6 sm:p-8">
                            <div className="mb-8">
                                <div className="mb-4 flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <KeyRound className="size-5" />
                                </div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                                    Password reset
                                </p>
                                <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                                    {canReset ? 'Choose a new password' : 'Reset link expired'}
                                </h2>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    {canReset
                                        ? 'Enter and confirm your new password.'
                                        : 'Use the forgot password form to request a fresh recovery link.'}
                                </p>
                            </div>

                            {canReset ? (
                                <ResetPasswordForm />
                            ) : (
                                <div className="space-y-4">
                                    <div className="rounded-md border border-destructive/20 bg-destructive/[0.08] px-3 py-2 text-sm text-destructive">
                                        This password reset link is invalid or has expired.
                                    </div>
                                    <Button asChild className="w-full">
                                        <Link href="/forgot-password">Request a new link</Link>
                                    </Button>
                                </div>
                            )}

                            <div className="mt-6 flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                                <ShieldCheck className="size-4 text-emerald-600" />
                                {hasRecoveryCookie
                                    ? 'Recovery sessions are cleared after the password is updated.'
                                    : 'Password changes require a verified recovery email link.'}
                            </div>
                        </CardContent>
                    </Card>
                </section>
            </div>
        </main>
    )
}
