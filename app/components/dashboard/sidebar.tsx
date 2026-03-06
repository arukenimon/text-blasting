"use client";

import {
    BarChart2,
    FileText,
    Inbox,
    LayoutDashboard,
    LogOut,
    Megaphone,
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

    return (
        <aside className="hidden w-64 shrink-0 flex-col border-r bg-card lg:flex">
            {/* Brand */}
            <div className="flex items-center gap-3 px-5 py-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold tracking-wide text-primary-foreground">
                    TB
                </div>
                <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-muted-foreground">Admin Panel</p>
                    <p className="truncate text-sm font-semibold">Text Blasting</p>
                </div>
            </div>

            <Separator />

            {/* Nav */}
            <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Main Menu
                </p>
                {items.map((item) => {
                    const isActive =
                        item.href === "/"
                            ? pathname === "/"
                            : pathname === item.href;
                    const Icon = navIcons[item.name] ?? LayoutDashboard;
                    return (
                        <Button
                            key={item.name}
                            variant={isActive ? "default" : "ghost"}
                            className="w-full justify-start gap-3"
                            asChild
                        >
                            <Link href={item.href}>
                                <Icon className="size-4 shrink-0" />
                                <span className="flex-1 text-left">{item.name}</span>
                                {item.badge ? (
                                    <Badge
                                        variant={isActive ? "outline" : "secondary"}
                                        className={`text-[10px] ${isActive ? "border-primary-foreground/40 text-primary-foreground" : ""}`}
                                    >
                                        {item.badge}
                                    </Badge>
                                ) : null}
                            </Link>
                        </Button>
                    );
                })}
            </nav>

            {/* Compliance */}
            <Separator />
            <div className="px-5 py-4">
                <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold">Compliance Health</p>
                    <span className="text-xs font-semibold text-emerald-600">92/100</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-[92%] rounded-full bg-emerald-500" />
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground">Carrier trust score · good standing</p>
            </div>

            {/* User */}
            <Separator />
            <div className="flex items-center gap-3 px-5 py-4">
                <Avatar size="sm">
                    <AvatarFallback className="bg-violet-100 text-violet-700 text-xs font-semibold">JD</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">Jane Doe</p>
                    <p className="truncate text-[11px] text-muted-foreground">Admin</p>
                </div>
                <Button variant="ghost" size="icon-sm" aria-label="Log out">
                    <LogOut className="size-4" />
                </Button>
            </div>
        </aside>
    );
}