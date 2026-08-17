"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MailCheck, ShieldCheck } from "lucide-react";
import { createAuthEmailClient } from "@/lib/supabase/email-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const authEmailClient = createAuthEmailClient();

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setMessage(null);
        setLoading(true);

        const redirectTo =
            typeof window === "undefined"
                ? undefined
                : `${window.location.origin}/reset-password`;

        await authEmailClient.auth.resetPasswordForEmail(email, { redirectTo });

        setMessage("If an account exists for that email, a password reset link has been sent.");
        setLoading(false);
    }

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
                                Secure reset
                            </p>
                            <h2 className="mt-3 text-4xl font-semibold tracking-tight">
                                Send a verified password reset link.
                            </h2>
                            <p className="mt-4 text-base leading-7 text-slate-200/78">
                                Supabase verifies the recovery token before the password form can be used.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="mx-auto w-full max-w-md">
                    <Card className="border-white/70 bg-white/[0.92] shadow-xl shadow-slate-900/[0.08] backdrop-blur">
                        <CardContent className="p-6 sm:p-8">
                            <div className="mb-8">
                                <div className="mb-4 flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <MailCheck className="size-5" />
                                </div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                                    Forgot password
                                </p>
                                <h2 className="mt-2 text-3xl font-semibold tracking-tight">Reset your password</h2>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Enter your email address and check your inbox for the recovery link.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label htmlFor="email" className="text-sm font-semibold">
                                        Email address
                                    </label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        required
                                        autoComplete="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="h-11"
                                    />
                                </div>
                                {message && (
                                    <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                                        {message}
                                    </div>
                                )}
                                <Button type="submit" className="h-11 w-full" disabled={loading}>
                                    {loading ? "Sending..." : "Send reset link"}
                                </Button>
                            </form>

                            <div className="mt-6 flex items-center justify-between gap-3 text-sm">
                                <Link href="/login" className="inline-flex items-center gap-2 font-semibold text-primary hover:text-primary/80">
                                    <ArrowLeft className="size-4" />
                                    Back to sign in
                                </Link>
                            </div>

                            <div className="mt-6 flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                                <ShieldCheck className="size-4 text-emerald-600" />
                                Reset links are verified before a new password can be saved.
                            </div>
                        </CardContent>
                    </Card>
                </section>
            </div>
        </main>
    );
}
