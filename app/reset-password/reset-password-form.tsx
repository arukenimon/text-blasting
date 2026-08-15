"use client";

import { useActionState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { reset_password } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState = { success: false, errors: {} as Record<string, string[]> };

export function ResetPasswordForm() {
    const [state, action, pending] = useActionState(reset_password, initialState);

    return (
        <form action={action} className="space-y-4">
            <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-semibold">
                    New password
                </label>
                <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Create a new password"
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
                    placeholder="Confirm the new password"
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
            <Button type="submit" className="h-11 w-full" disabled={pending}>
                {pending ? (
                    <>
                        <Loader2 className="size-4 animate-spin" />
                        Updating...
                    </>
                ) : (
                    <>
                        Update password
                        <ArrowRight className="size-4" />
                    </>
                )}
            </Button>
        </form>
    );
}
