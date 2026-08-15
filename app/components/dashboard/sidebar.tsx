"use client";

import {
    BarChart2,
    FileText,
    LayoutDashboard,
    LogOut,
    Megaphone,
    RadioTower,
    Settings,
    Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { NavItem } from "./dashboard-data";
import { useAuth } from "../auth-provider";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { useQuery } from "@tanstack/react-query";

const navIcons: Record<string, React.ElementType> = {
    Overview: LayoutDashboard,
    Campaigns: Megaphone,
    Audience: Users,
    Templates: FileText,
    Reports: BarChart2,
    Settings: Settings,
};

type SidebarProps = {
    items: NavItem[];
};

type SendingHealth = {
    ok: boolean;
    score: number;
    label: string;
    tone: "healthy" | "warning" | "danger";
    lookbackDays: number;
    signals: {
        gateway: {
            ok: boolean;
            activeDeviceCount?: number;
            deviceCount?: number;
            error?: string;
        };
        delivery: {
            attempted: number;
            delivered: number;
            failed: number;
            deliveryRate: number | null;
            failureRate: number | null;
        };
        audience: {
            total: number;
            optedOut: number;
            undeliverable: number;
            optOutRate: number | null;
            undeliverableRate: number | null;
        };
    };
};

const healthTone = {
    healthy: {
        icon: "bg-emerald-400/12 text-emerald-300",
        text: "text-emerald-300",
        bar: "bg-emerald-300",
    },
    warning: {
        icon: "bg-amber-400/12 text-amber-300",
        text: "text-amber-300",
        bar: "bg-amber-300",
    },
    danger: {
        icon: "bg-red-400/12 text-red-300",
        text: "text-red-300",
        bar: "bg-red-300",
    },
};

function formatHealthDetail(health?: SendingHealth) {
    if (!health) return "Checking signal";
    if (!health.signals.gateway.ok) {
        return health.signals.gateway.error ?? "Gateway needs attention";
    }
    if (health.signals.delivery.attempted === 0) {
        return "No recent sends";
    }
    const delivered = health.signals.delivery.deliveryRate;
    const failed = health.signals.delivery.failed;
    return `${delivered ?? 0}% delivered - ${failed} failed`;
}

export function Sidebar({ items }: SidebarProps) {
    const pathname = usePathname();
    const { user, signOut, activeWorkspace } = useAuth();
    const { data: sendingHealth, isError } = useQuery({
        queryKey: ["sending-health", activeWorkspace?.id],
        enabled: Boolean(activeWorkspace?.id),
        refetchInterval: 60_000,
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        queryFn: async (): Promise<SendingHealth> => {
            const res = await fetch("/api/sending-health", { cache: "no-store" });
            const body = await res.json().catch(() => ({}));
            if (!res.ok || body?.ok === false) {
                throw new Error(typeof body.error === "string" ? body.error : "Unable to check sending health");
            }
            return body as SendingHealth;
        },
    });
    const healthScore = sendingHealth?.score ?? 0;
    const tone = isError ? healthTone.danger : healthTone[sendingHealth?.tone ?? "warning"];
    const healthLabel = isError ? "Check failed" : sendingHealth?.label ?? "Checking";
    const healthDetail = isError
        ? "Unable to refresh status"
        : `${healthLabel} - ${formatHealthDetail(sendingHealth)}`;
    const healthScoreLabel = sendingHealth ? String(sendingHealth.score) : "--";

    return (
        <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
            <div className="flex items-center gap-3 px-5 py-5">
                <div className="flex size-10 items-center justify-center rounded-lg bg-sidebar-primary text-sm font-black tracking-tight text-sidebar-primary-foreground">
                    TB
                </div>
                <div className="min-w-0">
                    <p className="truncate text-[11px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/55">
                        SMS Ops
                    </p>
                    <p className="truncate text-base font-semibold">Text Blasting</p>
                </div>
            </div>

            <Separator className="bg-sidebar-border" />

            <div className="px-5 py-4">
                <WorkspaceSwitcher />
            </div>

            <Separator className="bg-sidebar-border" />

            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-sidebar-foreground/45">
                    Workspace
                </p>
                {items.map((item) => {
                    const isActive =
                        item.href === "/admin/dashboard"
                            ? pathname === "/admin" || pathname === "/admin/dashboard"
                            : pathname === item.href;
                    const Icon = navIcons[item.name] ?? LayoutDashboard;

                    return (
                        <Button
                            key={item.name}
                            variant="ghost"
                            className={`h-10 w-full justify-start gap-3 px-3 text-sidebar-foreground/72 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                                isActive ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" : ""
                            }`}
                            asChild
                        >
                            <Link href={item.href}>
                                <Icon className={`size-4 shrink-0 ${isActive ? "text-sidebar-primary" : ""}`} />
                                <span className="flex-1 text-left">{item.name}</span>
                                {item.badge ? (
                                    <Badge
                                        variant="outline"
                                        className="border-sidebar-border bg-sidebar/40 text-[10px] text-sidebar-foreground/70"
                                    >
                                        {item.badge}
                                    </Badge>
                                ) : null}
                            </Link>
                        </Button>
                    );
                })}
            </nav>

            <Separator className="bg-sidebar-border" />
            <div className="px-5 py-4">
                <div className="rounded-lg border border-sidebar-border bg-white/[0.04] p-3">
                    <div className="mb-3 flex items-center gap-2">
                        <div className={`flex size-8 items-center justify-center rounded-md ${tone.icon}`}>
                            <RadioTower className="size-4" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold">Sending Health</p>
                            <p className="truncate text-[11px] text-sidebar-foreground/50">{healthDetail}</p>
                        </div>
                        <span className={`ml-auto text-xs font-bold ${tone.text}`}>{healthScoreLabel}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                            className={`h-full rounded-full ${tone.bar}`}
                            style={{ width: `${healthScore}%` }}
                        />
                    </div>
                </div>
            </div>

            <Separator className="bg-sidebar-border" />
            <div className="flex items-center gap-3 px-5 py-4">
                <Avatar size="sm">
                    <AvatarFallback className="bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground">
                        {user?.email?.slice(0, 2).toUpperCase() ?? "AD"}
                    </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{user?.email ?? "Admin"}</p>
                    <p className="truncate text-[11px] text-sidebar-foreground/50">Administrator</p>
                </div>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Log out"
                    onClick={signOut}
                    className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                    <LogOut className="size-4" />
                </Button>
            </div>
        </aside>
    );
}
