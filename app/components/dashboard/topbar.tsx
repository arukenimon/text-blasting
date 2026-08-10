"use client";

import { Bell, Download, Plus, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const pageCopy: Record<string, { eyebrow: string; title: string; description: string }> = {
    "/admin": {
        eyebrow: "Command center",
        title: "Dashboard Overview",
        description: "Monitor campaign flow, delivery quality, and account readiness.",
    },
    "/admin/dashboard": {
        eyebrow: "Command center",
        title: "Dashboard Overview",
        description: "Monitor campaign flow, delivery quality, and account readiness.",
    },
    "/admin/audience": {
        eyebrow: "Contacts",
        title: "Audience",
        description: "Organize segments, import contacts, and keep list hygiene visible.",
    },
    "/admin/templates": {
        eyebrow: "Messaging",
        title: "Templates",
        description: "Create approved SMS copy with variables and segment-aware previews.",
    },
    "/admin/campaigns": {
        eyebrow: "Broadcasts",
        title: "Campaigns",
        description: "Schedule, send, and measure outbound SMS campaigns.",
    },
    "/admin/settings": {
        eyebrow: "Configuration",
        title: "Settings",
        description: "Manage account security, SMS gateway credentials, and webhooks.",
    },
};

export function Topbar() {
    const pathname = usePathname();
    const copy = pageCopy[pathname] ?? pageCopy["/admin"];

    return (
        <header className="rounded-lg border border-border/80 bg-card/95 px-4 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:px-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                {copy.eyebrow}
            </p>
            <div className="mt-1 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                        {copy.title}
                    </h1>
                    <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{copy.description}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search workspace..."
                            className="h-9 w-full min-w-48 pl-9 sm:w-56"
                        />
                    </div>

                    <Button variant="outline" size="sm">
                        <Download />
                        Export
                    </Button>

                    <Button size="sm" asChild>
                        <Link href="/admin/campaigns">
                            <Plus />
                            New Campaign
                        </Link>
                    </Button>

                    <Button variant="outline" size="icon-sm" aria-label="Notifications" className="relative">
                        <Bell />
                        <span className="absolute right-2 top-2 size-1.5 rounded-full bg-amber-400 ring-1 ring-background" />
                    </Button>
                </div>
            </div>
        </header>
    );
}
