import { CheckCircle2, MessageCircle, Send, TrendingDown, TrendingUp, UserMinus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { StatItem } from "./dashboard-data";

const iconMap: Record<string, React.ElementType> = {
    "Messages Sent": Send,
    "Delivery Rate": CheckCircle2,
    "Reply Rate": MessageCircle,
    "Opt-out Rate": UserMinus,
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
                    <Card key={item.label} className={`gap-3 border-l-4 py-5 ${item.accentColor}`}>
                        <CardContent className="px-5">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        {item.label}
                                    </p>
                                    <p className="mt-2 text-2xl font-bold tracking-tight tabular-nums">{item.value}</p>
                                </div>
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                                    <Icon className="size-4 text-muted-foreground" />
                                </div>
                            </div>
                            <div className="mt-3 flex items-center gap-1.5">
                                <TrendIcon
                                    className={`size-3.5 shrink-0 ${item.positive ? "text-emerald-500" : "text-destructive"
                                        }`}
                                />
                                <p
                                    className={`text-xs font-semibold ${item.positive ? "text-emerald-600" : "text-destructive"
                                        }`}
                                >
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