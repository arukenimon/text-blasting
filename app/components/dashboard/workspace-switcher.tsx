"use client";

import { Loader2, PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { switch_workspace } from "@/app/admin/workspaces/actions";
import { useAuth } from "../auth-provider";

export function WorkspaceSwitcher({ compact = false }: { compact?: boolean }) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { activeWorkspace, workspaces } = useAuth();
    const [pending, setPending] = useState(false);

    if (!activeWorkspace || workspaces.length === 0) return null;

    const handleSwitch = async (workspaceId: string) => {
        if (workspaceId === activeWorkspace.id) return;
        setPending(true);
        const result = await switch_workspace(workspaceId);
        if (result.success) {
            await queryClient.invalidateQueries();
            router.refresh();
        }
        setPending(false);
    };

    return (
        <div className={compact ? "min-w-0" : "space-y-1.5"}>
            {!compact && (
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/45">
                    Active workspace
                </p>
            )}
            <Select value={activeWorkspace.id} onValueChange={handleSwitch} disabled={pending}>
                <SelectTrigger
                    className={
                        compact
                            ? "h-9 w-48"
                            : "h-9 w-full border-sidebar-border bg-sidebar-accent/70 text-sidebar-foreground shadow-none hover:bg-sidebar-accent focus-visible:border-sidebar-ring focus-visible:ring-sidebar-ring/30 [&_svg]:text-sidebar-foreground/55"
                    }
                >
                    {pending ? (
                        <span className="flex items-center gap-2">
                            <Loader2 className="size-3.5 animate-spin" />
                            Switching
                        </span>
                    ) : (
                        <SelectValue />
                    )}
                </SelectTrigger>
                <SelectContent>
                    {workspaces.map((workspace) => (
                        <SelectItem key={workspace.id} value={workspace.id}>
                            <span className="truncate">{workspace.name}</span>
                            <span className="ml-2 text-xs capitalize text-muted-foreground">{workspace.role}</span>
                        </SelectItem>
                    ))}
                    <SelectSeparator />
                    <SelectItem value="add-workspace-soon" disabled className="text-muted-foreground">
                        <PlusCircle className="size-3.5" />
                        <span className="truncate">Add New Workspace</span>
                        <span className="ml-2 text-xs uppercase tracking-wide text-muted-foreground">Soon</span>
                    </SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}
