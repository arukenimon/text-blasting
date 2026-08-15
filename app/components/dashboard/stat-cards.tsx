import { CheckCircle2, Send, TrendingDown, TrendingUp, TriangleAlert, UserMinus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { StatItem } from "./dashboard-data";

const iconMap: Record<string, React.ElementType> = {
    "Messages Sent": Send,
    "Delivery Rate": CheckCircle2,
    "Failed Messages": TriangleAlert,
    "Opt-out Rate": UserMinus,
};

const accentMap: Record<string, string> = {
    "Messages Sent": "bg-primary/10 text-primary",
    "Delivery Rate": "bg-emerald-500/10 text-emerald-700",
    "Failed Messages": "bg-red-500/10 text-red-700",
    "Opt-out Rate": "bg-amber-500/12 text-amber-700",
};

type StatCardsProps = {
    items: StatItem[];
};

export function StatCards({ items }: StatCardsProps) {
    return (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {items.map((item) => {
                const Icon = iconMap[item.label] ?? Send;
                const TrendIcon = item.positive ? TrendingUp : TrendingDown;

                return (
                    <Card key={item.label} className="overflow-hidden py-0">
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                        {item.label}
                                    </p>
                                    <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">
                                        {item.value}
                                    </p>
                                </div>
                                <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${accentMap[item.label] ?? "bg-muted text-muted-foreground"}`}>
                                    <Icon className="size-4" />
                                </div>
                            </div>
                            <div className="mt-5 flex items-center gap-1.5 border-t pt-3">
                                <TrendIcon
                                    className={`size-3.5 shrink-0 ${item.positive ? "text-emerald-600" : "text-destructive"}`}
                                />
                                <p className={`text-xs font-semibold ${item.positive ? "text-emerald-700" : "text-destructive"}`}>
                                    {item.trend}
                                </p>
                                <p className="text-xs text-muted-foreground">vs last week</p>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </section>
    );
}
