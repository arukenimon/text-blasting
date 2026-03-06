import { navItems } from "./dashboard-data";
import { Sidebar } from "./sidebar";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-muted/40 text-foreground">
            <div className="mx-auto flex min-h-screen max-w-[1600px]">
                <Sidebar items={navItems} />
                <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
            </div>
        </div>
    );
}
