"use client";

import { useActionState, useEffect, useState } from "react";
import { CheckCircle2, KeyRound, Loader2, UsersRound, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "../../components/dashboard/dashboard-layout";
import { reregister_webhooks, update_password, update_sms_gateway, update_workspace_name } from "./actions";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/app/components/auth-provider";
import {
    canManageWorkspace,
    getWorkspaceGatewayOption,
    getWorkspaceTeamOption,
} from "../workspaces/QueryOptions";
import { invite_workspace_member } from "../workspaces/actions";

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
    const router = useRouter();
    const { activeWorkspace, activeRole } = useAuth();
    const workspaceId = activeWorkspace?.id;
    const canManage = canManageWorkspace(activeRole);
    const queryClient = useQueryClient();
    const [state, action, pending] = useActionState(update_sms_gateway, initialState);
    const [workspaceState, workspaceAction, workspacePending] = useActionState(update_workspace_name, initialState);
    const [inviteState, inviteAction, invitePending] = useActionState(invite_workspace_member, initialState);
    const { data: profile } = useQuery(getWorkspaceGatewayOption(canManage ? workspaceId : null));
    const { data: team } = useQuery(getWorkspaceTeamOption(canManage ? workspaceId : null));
    const [testing, setTesting] = useState(false);
    const [reregistering, setReregistering] = useState(false);
    const [testResult, setTestResult] = useState<ConnectionResult>(null);
    const [reregMessage, setReregMessage] = useState<string | null>(null);

    useEffect(() => {
        if (state?.success) {
            queryClient.invalidateQueries({ queryKey: ["workspace-gateway"] });
        }
    }, [state, queryClient]);

    useEffect(() => {
        if (inviteState?.success) {
            queryClient.invalidateQueries({ queryKey: ["workspace-team"] });
        }
    }, [inviteState, queryClient]);

    useEffect(() => {
        if (workspaceState?.success) {
            queryClient.invalidateQueries({ queryKey: ["workspace-context"] });
            router.refresh();
        }
    }, [workspaceState, queryClient, router]);

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
        await queryClient.invalidateQueries({ queryKey: ["workspace-gateway"] });
        setReregistering(false);
    };

    const webhookPreview = profile?.webhook_token
        ? `${typeof window !== "undefined" ? window.location.origin : ""}/api/webhooks/${profile.webhook_token}`
        : "—";
    const registeredCount = Object.keys(profile?.webhook_registrations ?? {}).length;

    if (!activeWorkspace) {
        return (
            <Section title="Workspace settings" description="Loading active workspace.">
                <p className="text-sm text-muted-foreground">Workspace context is loading.</p>
            </Section>
        );
    }

    if (!canManage) {
        return (
            <Section
                title="Workspace settings"
                description="Gateway credentials, webhooks, and team management are available to owners and admins."
            >
                <p className="text-sm text-muted-foreground">
                    Your role in {activeWorkspace?.name ?? "this workspace"} is member.
                </p>
            </Section>
        );
    }

    return (
        <div className="space-y-4">
            <form action={workspaceAction}>
            <Section title="Workspace" description="Name shown in navigation, switching, and team settings.">
                <Field label="Workspace name" error={workspaceState.errors.workspace_name?.[0]}>
                    <Input
                        name="workspace_name"
                        placeholder="Acme Marketing"
                        defaultValue={activeWorkspace.name}
                        maxLength={80}
                        required
                    />
                </Field>
                {workspaceState.success && (
                    <p className="text-sm text-emerald-600">Workspace name updated.</p>
                )}
                <div className="flex justify-end">
                    <Button type="submit" size="sm" disabled={workspacePending}>
                        {workspacePending ? "Saving..." : "Save workspace"}
                    </Button>
                </div>
            </Section>
            </form>

            <form action={action} className="space-y-4">
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
                title="SMS Gateway cloud server"
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
                title="Webhook"
                description="The SMS gateway pushes events to this URL. It is unique per workspace."
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

            <Section
                title="Team"
                description="Invite members into this workspace and review current access."
            >
                <div className="grid gap-3 sm:grid-cols-[1fr_140px_auto]">
                    <Field label="Invite email" error={inviteState.errors.email?.[0]}>
                        <Input name="email" type="email" placeholder="member@example.com" />
                    </Field>
                    <Field label="Role" error={inviteState.errors.role?.[0]}>
                        <Select name="role" defaultValue="member">
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="member">Member</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>
                    <div className="flex items-end">
                        <Button type="submit" size="sm" disabled={invitePending} formAction={inviteAction}>
                            {invitePending ? "Sending..." : "Send invite"}
                        </Button>
                    </div>
                </div>
                {inviteState.errors.form?.[0] && (
                    <p className="text-xs text-destructive">{inviteState.errors.form[0]}</p>
                )}
                {inviteState.success && (
                    <p className="text-xs text-emerald-600">Invite email sent.</p>
                )}

                <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        Members
                    </p>
                    {(team?.members ?? []).map((member) => (
                        <div key={member.user_id} className="flex items-center justify-between rounded-md border px-3 py-2">
                            <span className="truncate text-sm">{member.user_email ?? member.user_id}</span>
                            <span className="text-xs font-medium capitalize text-muted-foreground">{member.role}</span>
                        </div>
                    ))}
                    {(team?.members ?? []).length === 0 && (
                        <p className="text-xs text-muted-foreground">No members loaded yet.</p>
                    )}
                </div>

                {(team?.invitations ?? []).length > 0 && (
                    <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                            Invitations
                        </p>
                        {team!.invitations.map((invite) => (
                            <div key={invite.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                                <span className="truncate text-sm">{invite.email}</span>
                                <span className="text-xs capitalize text-muted-foreground">
                                    {invite.role} · {invite.status}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
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
        </div>
    );
}

const tabs = [
    { value: "security", label: "Account", icon: KeyRound },
    { value: "sms", label: "Workspace", icon: UsersRound },
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
