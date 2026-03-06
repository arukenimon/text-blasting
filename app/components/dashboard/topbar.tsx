import { Bell, Download, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Topbar() {
    return (
        <header className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                    Monday, March 2, 2026
                </p>
                <h1 className="mt-0.5 text-2xl font-semibold tracking-tight">Dashboard Overview</h1>
            </div>

            <div className="flex items-center gap-2">
                {/* Search */}
                <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search campaigns…"
                        className="w-52 pl-9"
                    />
                </div>

                <Button variant="outline" size="sm">
                    <Download />
                    Export
                </Button>

                <Button size="sm">
                    <Plus />
                    New Campaign
                </Button>

                <Button variant="outline" size="icon-sm" aria-label="Notifications" className="relative">
                    <Bell />
                    <span className="absolute right-2 top-2 size-1.5 rounded-full bg-violet-500 ring-1 ring-background" />
                </Button>
            </div>
        </header>
    );
}