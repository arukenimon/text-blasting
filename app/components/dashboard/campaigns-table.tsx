import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import type { CampaignItem, CampaignStatus } from "./dashboard-data";

type CampaignsTableProps = {
    items: CampaignItem[];
};

const statusConfig: Record<
    CampaignStatus,
    { variant: "default" | "secondary" | "outline" | "destructive"; dot: string }
> = {
    Completed: { variant: "outline", dot: "bg-emerald-500" },
    Running: { variant: "default", dot: "bg-blue-500" },
    Scheduled: { variant: "secondary", dot: "bg-amber-400" },
    Draft: { variant: "outline", dot: "bg-muted-foreground" },
    Paused: { variant: "secondary", dot: "bg-orange-400" },
};

function DeliveryBar({ sent, delivered }: { sent: number; delivered: number }) {
    const pct = Math.round((delivered / sent) * 100);
    return (
        <div className="flex items-center gap-2">
            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
            </div>
            <span className="tabular-nums text-xs text-muted-foreground">{pct}%</span>
        </div>
    );
}

export function CampaignsTable({ items }: CampaignsTableProps) {
    return (
        <Card className="gap-0 py-0">
            <CardHeader className="flex-row items-center justify-between border-b px-6 py-4">
                <div>
                    <CardTitle className="text-base">Recent Campaigns</CardTitle>
                    <p className="text-xs text-muted-foreground">{items.length} campaigns</p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                    <a href="#">
                        View all <ArrowRight />
                    </a>
                </Button>
            </CardHeader>

            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/40">
                            <TableHead className="px-6 text-xs font-semibold uppercase tracking-wide">Campaign</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wide">Audience</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wide">Sent</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wide">Delivery</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wide">Status</TableHead>
                            <TableHead />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map((item) => {
                            const cfg = statusConfig[item.status];
                            return (
                                <TableRow key={item.id} className="group">
                                    <TableCell className="px-6 font-medium">{item.name}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="font-normal">
                                            {item.audience}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="tabular-nums text-muted-foreground">
                                        {item.sent.toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        <DeliveryBar sent={item.sent} delivered={item.delivered} />
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={cfg.variant} className="gap-1.5">
                                            <span className={`size-1.5 rounded-full ${cfg.dot}`} />
                                            {item.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="pr-4">
                                        <Button
                                            variant="outline"
                                            size="xs"
                                            className="invisible group-hover:visible"
                                        >
                                            View
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}