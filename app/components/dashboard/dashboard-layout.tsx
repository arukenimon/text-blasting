import { navItems } from "./dashboard-data";
import { Sidebar } from "./sidebar";
import Link from "next/link";
import { WorkspaceSwitcher } from "./workspace-switcher";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.09),transparent_30%),linear-gradient(180deg,rgba(248,250,252,0.95),rgba(241,245,249,0.72))] text-foreground">
            <div className="flex min-h-screen w-full">
                <Sidebar items={navItems} />
                <main className="min-w-0 flex-1 px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
                    <div className="mb-4 rounded-lg border border-border/80 bg-card p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] lg:hidden">
                        <div className="mb-3 flex items-center gap-3">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-xs font-black text-primary-foreground">
                                RC
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                                    SMS Ops
                                </p>
                                <p className="text-sm font-semibold">Relay Campaigns</p>
                            </div>
                        </div>
                        <div className="mb-3">
                            <WorkspaceSwitcher compact />
                        </div>
                        <nav className="flex gap-2 overflow-x-auto pb-1">
                            {navItems
                                .filter((item) => item.href !== "#")
                                .map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className="shrink-0 rounded-md border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground"
                                    >
                                        {item.name}
                                    </Link>
                                ))}
                        </nav>
                    </div>
                    <div className="w-full">{children}</div>
                </main>
            </div>
        </div>
    );
}
