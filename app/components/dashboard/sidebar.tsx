"use client";

import {
    BarChart2,
    FileText,
    Inbox,
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

const navIcons: Record<string, React.ElementType> = {
    Overview: LayoutDashboard,
    Campaigns: Megaphone,
    Audience: Users,
    Templates: FileText,
    Inbox: Inbox,
    Reports: BarChart2,
    Settings: Settings,
};

type SidebarProps = {
    items: NavItem[];
};

export function Sidebar({ items }: SidebarProps) {
    const pathname = usePathname();
    const { user, signOut } = useAuth();

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

            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-sidebar-foreground/45">
                    Workspace
                </p>
                {items.map((item) => {
                    const isActive =
                        item.href === "/admin"
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
                        <div className="flex size-8 items-center justify-center rounded-md bg-emerald-400/12 text-emerald-300">
                            <RadioTower className="size-4" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold">Carrier Health</p>
                            <p className="text-[11px] text-sidebar-foreground/50">Good standing</p>
                        </div>
                        <span className="ml-auto text-xs font-bold text-emerald-300">92</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                        <div className="h-full w-[92%] rounded-full bg-emerald-300" />
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
