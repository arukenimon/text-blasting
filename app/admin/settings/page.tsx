"use client";

import { useActionState, useEffect, useState } from "react";
import { KeyRound, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "../../components/dashboard/dashboard-layout";
import { update_password, update_sms_gateway } from "./actions";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getProfileOption } from "./QueryOptions";
import { useAuth } from "@/app/components/auth-provider";

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type ActionState = {
    success: boolean;
    errors: Record<string, string[]>;
};

const initialState: ActionState = { success: false, errors: {} };

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
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

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <div className="grid gap-1.5">
            <label className="text-sm font-medium">{label}</label>
            {children}
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}

// â”€â”€â”€ Tabs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
                <Button type="submit" size="sm" disabled={pending}>{pending ? "Updatingâ€¦" : "Update password"}</Button>
            </div>
        </form>
    );
}

function SmsTab() {

    //const { data: profile } = useQuery(getProfileOption());

    const { profile } = useAuth();
    const queryClient = useQueryClient();
    const [state, action, pending] = useActionState(update_sms_gateway, initialState);

    const refreshData = async () => {
        await queryClient.invalidateQueries({
            queryKey: ['profile']
        });
    }

    const registerWebhooks = async () => {
        try {
            const response = await fetch('/api/register_webhook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('Failed to register webhooks:', data.error || 'Unknown error');
            } else {
                console.log('Webhooks registered successfully:', data);
            }

        }
        catch (e) {
            console.error("Failed to register webhooks:", e);
        }
    }

    useEffect(() => {
        if (state?.success) {
            refreshData();

            registerWebhooks();
        }
    }, [state])

    return (
        <form action={action} className="space-y-4">
            <Section title="Local server" description="Credentials shown in the SMS Gateway app's Local server section.">
                <Field label="Local address" error={state.errors.local_address?.[0]}>
                    <Input name="local_address" placeholder="192.168.1.40:8080" defaultValue={profile?.local_server?.local_address} />
                </Field>
                <Field label="Public address">
                    <Input name="public_address" placeholder="49.145.212.34:8080" defaultValue={profile?.local_server?.public_address} />
                </Field>
                <Separator />
                <Field label="Username" error={state.errors.local_username?.[0]}>
                    <Input name="local_username" placeholder="admin" autoComplete="off" defaultValue={profile?.local_server?.username} />
                </Field>
                <Field label="Password" error={state.errors.local_password?.[0]}>
                    <Input name="local_password" type="password" placeholder="Password" autoComplete="new-password" defaultValue={profile?.local_server?.password} />
                </Field>
            </Section>

            <Section title="Cloud server" description="Credentials shown in the SMS Gateway app's Cloud server section.">
                <Field label="Server address" error={state.errors.cloud_address?.[0]}>
                    <Input name="cloud_address" placeholder="api.sms-gate.app:443" defaultValue={profile?.cloud_server?.server_address} />
                </Field>
                <Separator />
                <Field label="Username" error={state.errors.cloud_username?.[0]}>
                    <Input name="cloud_username" placeholder="DJQJ6S" autoComplete="off" defaultValue={profile?.cloud_server?.username} />
                </Field>
                <Field label="Password" error={state.errors.cloud_password?.[0]}>
                    <Input name="cloud_password" type="password" placeholder="Password" autoComplete="new-password" defaultValue={profile?.cloud_server?.password} />
                </Field>
            </Section>

            {state.errors._?.[0] && <p className="text-sm text-destructive">{state.errors._[0]}</p>}
            {state.success && <p className="text-sm text-emerald-600">Credentials saved!</p>}

            <div className="flex justify-end">
                <Button type="submit" size="sm" disabled={pending}>{pending ? "Saving..." : "Save credentials"}</Button>
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
    const [active, setActive] = useState<TabValue>("security");

    return (
        <DashboardLayout>
            <header className="border-b pb-5">
                <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Admin</p>
                <h1 className="mt-0.5 text-2xl font-semibold tracking-tight">Settings</h1>
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

                <div className="max-w-lg">
                    {active === "security" && <SecurityTab />}
                    {active === "sms" && <SmsTab />}
                </div>
            </div>
        </DashboardLayout>
    );
}
