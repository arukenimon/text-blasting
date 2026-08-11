"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, LockKeyhole, MessageSquareText, RadioTower, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        }

        const redirectTo = searchParams.get("redirectTo") ?? "/admin/dashboard";
        router.push(redirectTo);
        router.refresh();
    }

    return (
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
            <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-semibold">
                    Password
                </label>
                <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11"
                />
            </div>
            {error && (
                <div className="rounded-md border border-destructive/20 bg-destructive/[0.08] px-3 py-2 text-sm text-destructive">
                    {error}
                </div>
            )}
            <Button type="submit" className="h-11 w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
                {!loading && <ArrowRight className="size-4" />}
            </Button>
        </form>
    );
}

export default function LoginPage() {
    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_20%_10%,rgba(20,184,166,0.18),transparent_28%),linear-gradient(135deg,#f8fafc_0%,#eef6f5_48%,#f5f7fb_100%)] p-4 text-foreground">
            <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl items-center gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                <section className="hidden min-h-[640px] flex-col justify-between rounded-lg border border-white/60 bg-[linear-gradient(145deg,rgba(15,23,42,0.96),rgba(21,94,117,0.88))] p-8 text-white shadow-2xl shadow-slate-900/[0.12] lg:flex">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="flex size-11 items-center justify-center rounded-lg bg-emerald-300 text-sm font-black text-slate-950">
                                TB
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-100/70">
                                    SMS Operations
                                </p>
                                <h1 className="text-xl font-semibold">Text Blasting</h1>
                            </div>
                        </div>

                        <div className="mt-14 max-w-xl">
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-200/75">
                                Secure campaign console
                            </p>
                            <h2 className="mt-3 text-4xl font-semibold tracking-tight">
                                Broadcasts, contacts, and gateway health in one focused workspace.
                            </h2>
                            <p className="mt-4 text-base leading-7 text-slate-200/78">
                                Sign in to queue campaigns, review delivery activity, manage segments, and keep webhook
                                routing under control.
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                        {[
                            { label: "Webhook routing", icon: RadioTower },
                            { label: "Opt-in aware", icon: ShieldCheck },
                            { label: "Message templates", icon: MessageSquareText },
                        ].map(({ label, icon: Icon }) => (
                            <div key={label} className="rounded-lg border border-white/10 bg-white/[0.08] p-3">
                                <Icon className="size-4 text-emerald-200" />
                                <p className="mt-3 text-sm font-medium">{label}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="mx-auto w-full max-w-md">
                    <div className="mb-6 flex items-center gap-3 lg:hidden">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-sm font-black text-primary-foreground">
                            TB
                        </div>
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                                SMS Ops
                            </p>
                            <p className="font-semibold">Text Blasting</p>
                        </div>
                    </div>

                    <Card className="border-white/70 bg-white/[0.92] shadow-xl shadow-slate-900/[0.08] backdrop-blur">
                        <CardContent className="p-6 sm:p-8">
                            <div className="mb-8">
                                <div className="mb-4 flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <LockKeyhole className="size-5" />
                                </div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                                    Admin access
                                </p>
                                <h2 className="mt-2 text-3xl font-semibold tracking-tight">Welcome back</h2>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Use your Supabase credentials to continue to the dashboard.
                                </p>
                            </div>

                            <Suspense>
                                <LoginForm />
                            </Suspense>

                            <div className="mt-6 flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                                <CheckCircle2 className="size-4 text-emerald-600" />
                                Protected by authenticated session routing.
                            </div>
                        </CardContent>
                    </Card>
                </section>
            </div>
        </main>
    );
}
