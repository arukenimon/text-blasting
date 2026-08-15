"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { complete_workspace_invitation } from "@/app/admin/workspaces/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState = { success: false, errors: {} as Record<string, string[]> };

export function InviteCompleteForm({ token }: { token: string }) {
    const router = useRouter();
    const [state, action, pending] = useActionState(complete_workspace_invitation, initialState);

    useEffect(() => {
        if (!state.success) return;
        router.push("/admin/settings");
        router.refresh();
    }, [router, state.success]);

    return (
        <form action={action} className="space-y-4">
            <input type="hidden" name="token" value={token} />
            <div className="space-y-1.5">
                <label htmlFor="full_name" className="text-sm font-semibold">
                    Full name
                </label>
                <Input
                    id="full_name"
                    name="full_name"
                    type="text"
                    autoComplete="name"
                    placeholder="Your name"
                    required
                    className="h-11"
                />
                {state.errors.full_name?.[0] && (
                    <p className="text-xs text-destructive">{state.errors.full_name[0]}</p>
                )}
            </div>
            <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-semibold">
                    Password
                </label>
                <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Create a password"
                    required
                    className="h-11"
                />
                {state.errors.password?.[0] && (
                    <p className="text-xs text-destructive">{state.errors.password[0]}</p>
                )}
            </div>
            <div className="space-y-1.5">
                <label htmlFor="confirm_password" className="text-sm font-semibold">
                    Confirm password
                </label>
                <Input
                    id="confirm_password"
                    name="confirm_password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Confirm your password"
                    required
                    className="h-11"
                />
                {state.errors.confirm_password?.[0] && (
                    <p className="text-xs text-destructive">{state.errors.confirm_password[0]}</p>
                )}
            </div>
            {state.errors.form?.[0] && (
                <div className="rounded-md border border-destructive/20 bg-destructive/[0.08] px-3 py-2 text-sm text-destructive">
                    {state.errors.form[0]}
                </div>
            )}
            {state.success && (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    Workspace invitation accepted.
                </div>
            )}
            <Button type="submit" className="h-11 w-full" disabled={pending || state.success}>
                {pending || state.success ? (
                    <>
                        <Loader2 className="size-4 animate-spin" />
                        Finishing setup...
                    </>
                ) : (
                    <>
                        Finish setup
                        <ArrowRight className="size-4" />
                    </>
                )}
            </Button>
        </form>
    );
}
