"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
    ArrowRight,
    LockKeyhole,
    MessageSquarePlus,
    RadioTower,
    ShieldCheck,
    UsersRound,
} from "lucide-react";
import { createAuthEmailClient } from "@/lib/supabase/email-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const authEmailClient = createAuthEmailClient();

function RegisterForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [fullName, setFullName] = useState("");
    const [workspaceName, setWorkspaceName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    function getRedirectTo() {
        const redirectTo = searchParams.get("redirectTo");
        if (redirectTo?.startsWith("/") && !redirectTo.startsWith("//")) return redirectTo;
        return "/admin/dashboard";
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setMessage(null);

        if (password.length < 8) {
            setError("Use a password with at least 8 characters.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (workspaceName.trim().length < 2) {
            setError("Workspace name must be at least 2 characters.");
            return;
        }

        setLoading(true);

        const redirectTo = getRedirectTo();
        const emailRedirectTo =
            typeof window === "undefined"
                ? undefined
                : `${window.location.origin}${redirectTo}`;

        const { data, error } = await authEmailClient.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo,
                data: {
                    full_name: fullName.trim(),
                    workspace_name: workspaceName.trim(),
                },
            },
        });

        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        }

        if (data.session) {
            router.push(redirectTo);
            router.refresh();
            return;
        }

        setMessage("Check your email to confirm your account. The confirmation link will bring you back into the app.");
        setLoading(false);
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
                <label htmlFor="fullName" className="text-sm font-semibold">
                    Full name
                </label>
                <Input
                    id="fullName"
                    type="text"
                    placeholder="Your name"
                    required
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-11"
                />
            </div>
            <div className="space-y-1.5">
                <label htmlFor="workspaceName" className="text-sm font-semibold">
                    Workspace name
                </label>
                <Input
                    id="workspaceName"
                    type="text"
                    placeholder="Acme Marketing"
                    required
                    autoComplete="organization"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    className="h-11"
                />
            </div>
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
                    placeholder="Create a password"
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11"
                />
            </div>
            <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="text-sm font-semibold">
                    Confirm password
                </label>
                <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-11"
                />
            </div>
            {error && (
                <div className="rounded-md border border-destructive/20 bg-destructive/[0.08] px-3 py-2 text-sm text-destructive">
                    {error}
                </div>
            )}
            {message && (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    {message}
                </div>
            )}
            <Button type="submit" className="h-11 w-full" disabled={loading}>
                {loading ? "Creating account..." : "Create account"}
                {!loading && <ArrowRight className="size-4" />}
            </Button>
        </form>
    );
}

export default function RegisterPage() {
    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_18%_12%,rgba(16,185,129,0.18),transparent_30%),linear-gradient(135deg,#f8fafc_0%,#edf7f3_45%,#f6f7fb_100%)] p-4 text-foreground">
            <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl items-center gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                <section className="hidden min-h-[680px] flex-col justify-between rounded-lg border border-white/60 bg-[linear-gradient(145deg,rgba(15,23,42,0.97),rgba(4,120,87,0.88))] p-8 text-white shadow-2xl shadow-slate-900/[0.12] lg:flex">
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
                                New admin workspace
                            </p>
                            <h2 className="mt-3 text-4xl font-semibold tracking-tight">
                                Start with your own SMS campaign workspace.
                            </h2>
                            <p className="mt-4 text-base leading-7 text-slate-200/78">
                                Create an account to manage contacts, reusable templates, campaign scheduling, and
                                gateway delivery tracking from one dashboard.
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                        {[
                            { label: "Personal workspace", icon: UsersRound },
                            { label: "Gateway setup", icon: RadioTower },
                            { label: "Protected access", icon: ShieldCheck },
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
                                    <MessageSquarePlus className="size-5" />
                                </div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                                    Register
                                </p>
                                <h2 className="mt-2 text-3xl font-semibold tracking-tight">Create your account</h2>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Name your first workspace and start with a clean SMS operations home.
                                </p>
                            </div>

                            <Suspense>
                                <RegisterForm />
                            </Suspense>

                            <p className="mt-6 text-center text-sm text-muted-foreground">
                                Already have an account?{" "}
                                <Link href="/login" className="font-semibold text-primary hover:text-primary/80">
                                    Sign in
                                </Link>
                            </p>

                            <div className="mt-6 flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                                <LockKeyhole className="size-4 text-emerald-600" />
                                Supabase handles account confirmation and secure sessions.
                            </div>
                        </CardContent>
                    </Card>
                </section>
            </div>
        </main>
    );
}
