"use client";

import { useActionState, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, KeyRound, Loader2, Smartphone, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "../../components/dashboard/dashboard-layout";
import { reregister_webhooks, update_password, update_sms_gateway } from "./actions";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/app/components/auth-provider";

type ActionState = {
    success: boolean;
    errors: Record<string, string[]>;
    webhookSecretSaved?: boolean;
};

const initialState: ActionState = { success: false, errors: {} };

function Section({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent className="space-y-4">{children}</CardContent>
        </Card>
    );
}

function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="grid gap-1.5">
            <label className="text-sm font-medium">{label}</label>
            {children}
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}

function SecurityTab() {
    const [state, action, pending] = useActionState(update_password, initialState);
    return (
        <form action={action} className="space-y-4">
            <Section title="Change password" description="Choose a strong password of at least 8 characters.">
                <Field label="New password" error={state.errors.password?.[0]}>
                    <Input name="password" type="password" autoComplete="new-password" required />
                </Field>
                <Field label="Confirm new password" error={state.errors.confirm_password?.[0]}>
                    <Input name="confirm_password" type="password" autoComplete="new-password" required />
                </Field>
                {state.errors._?.[0] && <p className="text-sm text-destructive">{state.errors._[0]}</p>}
                {state.success && <p className="text-sm text-emerald-600">Password updated successfully.</p>}
            </Section>
            <div className="flex justify-end">
                <Button type="submit" size="sm" disabled={pending}>
                    {pending ? "Updating…" : "Update password"}
                </Button>
            </div>
        </form>
    );
}

type ConnectionResult = { ok: boolean; mode?: string; error?: string; status?: number } | null;

function SmsTab() {
    const { profile } = useAuth();
    const queryClient = useQueryClient();
    const [state, action, pending] = useActionState(update_sms_gateway, initialState);
    const [mode, setMode] = useState<"local" | "cloud">(profile?.mode ?? "cloud");
    const [testing, setTesting] = useState(false);
    const [reregistering, setReregistering] = useState(false);
    const [testResult, setTestResult] = useState<ConnectionResult>(null);
    const [reregMessage, setReregMessage] = useState<string | null>(null);

    useEffect(() => {
        if (profile?.mode && profile.mode !== mode) setMode(profile.mode);
    }, [profile?.mode]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (state?.success) {
            queryClient.invalidateQueries({ queryKey: ["profile"] });
        }
    }, [state, queryClient]);

    const handleTestConnection = async () => {
        setTesting(true);
        setTestResult(null);
        try {
            const res = await fetch("/api/settings/sms-gateway/test", { method: "POST" });
            setTestResult(await res.json());
        } catch (e) {
            setTestResult({ ok: false, error: e instanceof Error ? e.message : "Request failed" });
        } finally {
            setTesting(false);
        }
    };

    const handleReregister = async () => {
        setReregistering(true);
        setReregMessage(null);
        const out = await reregister_webhooks();
        setReregMessage(
            out.ok
                ? "Webhooks re-registered successfully."
                : `Re-register completed with warnings: ${out.warnings.join("; ")}`
        );
        await queryClient.invalidateQueries({ queryKey: ["profile"] });
        setReregistering(false);
    };

    const webhookPreview = profile?.webhook_token
        ? `${typeof window !== "undefined" ? window.location.origin : ""}/api/webhooks/${profile.webhook_token}`
        : "—";
    const registeredCount = Object.keys(profile?.webhook_registrations ?? {}).length;

    return (
        <form action={action} className="space-y-4">
            <Section title="Gateway mode" description="Where this app should send messages and accept webhook events from.">
                <input type="hidden" name="mode" value={mode} />
                <div className="grid grid-cols-2 gap-3">
                    {(["cloud", "local"] as const).map((m) => (
                        <button
                            key={m}
                            type="button"
                            onClick={() => setMode(m)}
                            className={`text-left rounded-lg border p-3 transition ${
                                mode === m ? "border-primary bg-primary/5" : "hover:bg-muted/40"
                            }`}
                        >
                            <p className="text-sm font-medium capitalize">{m}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {m === "cloud" ? "Send via api.sms-gate.app" : "Send via your phone on LAN/Internet"}
                            </p>
                        </button>
                    ))}
                </div>
                {mode === "local" && (
                    <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
                        <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                        <p>
                            Local mode requires your phone&apos;s gateway to be reachable from this Vercel server.
                            Use a port-forward, Tailscale, ngrok, or Cloudflare Tunnel and put that public URL in
                            <strong> Public address</strong> below.
                        </p>
                    </div>
                )}
            </Section>

            <Section title="SIM card" description="Which SIM slot should be used to send messages.">
                <Field label="SIM slot" error={state.errors.sim_slot?.[0]}>
                    <div className="flex gap-3">
                        {(["1", "2"] as const).map((slot) => (
                            <label key={slot} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="sim_slot"
                                    value={slot}
                                    defaultChecked={String(profile?.sim_slot ?? 1) === slot}
                                    className="accent-primary"
                                />
                                <span className="text-sm">SIM {slot}</span>
                            </label>
                        ))}
                    </div>
                </Field>
            </Section>

            <Section
                title="Cloud server"
                description="Credentials from the SMS Gateway app's Cloud server section."
            >
                <Field label="Server address" error={state.errors.cloud_address?.[0]}>
                    <Input
                        name="cloud_address"
                        placeholder="api.sms-gate.app:443"
                        defaultValue={profile?.cloud_server?.server_address ?? "api.sms-gate.app:443"}
                    />
                </Field>
                <Separator />
                <Field label="Username" error={state.errors.cloud_username?.[0]}>
                    <Input
                        name="cloud_username"
                        placeholder="DJQJ6S"
                        autoComplete="off"
                        defaultValue={profile?.cloud_server?.username}
                    />
                </Field>
                <Field label="Password" error={state.errors.cloud_password?.[0]}>
                    <Input
                        name="cloud_password"
                        type="password"
                        placeholder="Password"
                        autoComplete="new-password"
                        defaultValue={profile?.cloud_server?.password}
                    />
                </Field>
            </Section>

            <Section
                title="Local server"
                description="Credentials from the SMS Gateway app's Local server section."
            >
                <Field label="Local address" error={state.errors.local_address?.[0]}>
                    <Input
                        name="local_address"
                        placeholder="192.168.1.40:8080"
                        defaultValue={profile?.local_server?.local_address}
                    />
                </Field>
                <Field label="Public address (required for Local mode)" error={state.errors.public_address?.[0]}>
                    <Input
                        name="public_address"
                        placeholder="49.145.212.34:8080 or your-tunnel-url"
                        defaultValue={profile?.local_server?.public_address}
                    />
                </Field>
                <Separator />
                <Field label="Username" error={state.errors.local_username?.[0]}>
                    <Input
                        name="local_username"
                        placeholder="admin"
                        autoComplete="off"
                        defaultValue={profile?.local_server?.username}
                    />
                </Field>
                <Field label="Password" error={state.errors.local_password?.[0]}>
                    <Input
                        name="local_password"
                        type="password"
                        placeholder="Password"
                        autoComplete="new-password"
                        defaultValue={profile?.local_server?.password}
                    />
                </Field>
            </Section>

            <Section
                title="Webhook"
                description="The SMS gateway pushes events to this URL. It is unique per user."
            >
                <Field label="Your webhook URL">
                    <Input value={webhookPreview} readOnly className="font-mono text-xs" />
                </Field>
                <Field label="Signing key" error={state.errors.webhook_secret?.[0]}>
                    <Input
                        name="webhook_secret"
                        type="password"
                        placeholder="Leave blank to keep current signing key"
                        autoComplete="new-password"
                    />
                </Field>
                {state.webhookSecretSaved && (
                    <p className="text-xs text-emerald-600">Signing key saved for webhook verification.</p>
                )}
                <p className="text-xs text-muted-foreground">
                    Registered events on the gateway: <span className="font-medium">{registeredCount}</span>
                </p>
                <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" disabled={testing} onClick={handleTestConnection}>
                        {testing ? <Loader2 className="size-4 animate-spin" /> : "Test connection"}
                    </Button>
                    <Button type="button" variant="outline" size="sm" disabled={reregistering} onClick={handleReregister}>
                        {reregistering ? <Loader2 className="size-4 animate-spin" /> : "Re-register webhooks"}
                    </Button>
                </div>
                {testResult && (
                    <p
                        className={`text-xs flex items-center gap-1.5 ${
                            testResult.ok ? "text-emerald-600" : "text-destructive"
                        }`}
                    >
                        {testResult.ok ? <CheckCircle2 className="size-3.5" /> : <XCircle className="size-3.5" />}
                        {testResult.ok
                            ? `Connection ok (${testResult.mode})`
                            : `Failed: ${testResult.error ?? "unknown"}`}
                    </p>
                )}
                {reregMessage && <p className="text-xs text-muted-foreground">{reregMessage}</p>}
            </Section>

            {state.errors._?.[0] && <p className="text-sm text-destructive">{state.errors._[0]}</p>}
            {state.errors._webhook?.length ? (
                <div className="text-xs text-amber-700 rounded-md border border-amber-200 bg-amber-50 p-2.5">
                    Saved, but webhook setup had warnings:
                    <ul className="list-disc ml-4 mt-1">
                        {state.errors._webhook.map((m, i) => (
                            <li key={i}>{m}</li>
                        ))}
                    </ul>
                </div>
            ) : null}
            {state.success && !state.errors._webhook?.length && (
                <p className="text-sm text-emerald-600">Credentials saved & webhooks re-registered.</p>
            )}

            <div className="flex justify-end">
                <Button type="submit" size="sm" disabled={pending}>
                    {pending ? "Saving…" : "Save credentials"}
                </Button>
            </div>
        </form>
    );
}

const tabs = [
    { value: "security", label: "Security", icon: KeyRound },
    { value: "sms", label: "SMS", icon: Smartphone },
] as const;

type TabValue = (typeof tabs)[number]["value"];

export default function SettingsPage() {
    const [active, setActive] = useState<TabValue>("sms");

    return (
        <DashboardLayout>
            <header className="rounded-lg border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Configuration</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight">Settings</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Manage account security, SMS gateway credentials, and webhook registration.
                </p>
            </header>

            <div className="mt-6 space-y-6">
                <Tabs value={active} onValueChange={(v) => setActive(v as TabValue)}>
                    <TabsList>
                        {tabs.map(({ value, label, icon: Icon }) => (
                            <TabsTrigger key={value} value={value} className="gap-1.5">
                                <Icon className="size-3.5" />
                                {label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>

                <div className="max-w-2xl">
                    {active === "security" && <SecurityTab />}
                    {active === "sms" && <SmsTab />}
                </div>
            </div>
        </DashboardLayout>
    );
}
