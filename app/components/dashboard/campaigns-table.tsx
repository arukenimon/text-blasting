import { ArrowRight, Megaphone } from "lucide-react";
import Link from "next/link";
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
import type { CampaignItem_, CampaignStatus } from "./dashboard-data";

type CampaignsTableProps = {
    items: CampaignItem_[];
};

const statusConfig: Record<
    CampaignStatus,
    { variant: "default" | "secondary" | "outline" | "destructive"; dot: string }
> = {
    Completed: { variant: "outline", dot: "bg-emerald-500" },
    Running: { variant: "default", dot: "bg-primary-foreground" },
    Scheduled: { variant: "secondary", dot: "bg-amber-400" },
    Draft: { variant: "outline", dot: "bg-muted-foreground" },
    Paused: { variant: "secondary", dot: "bg-orange-400" },
};

export function CampaignsTable({ items }: CampaignsTableProps) {
    return (
        <Card className="gap-0 overflow-hidden py-0">
            <CardHeader className="flex-row items-center justify-between border-b bg-card px-5 py-4">
                <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Megaphone className="size-4" />
                    </div>
                    <div>
                        <CardTitle className="text-base">Recent Campaigns</CardTitle>
                        <p className="text-xs text-muted-foreground">{items.length} campaigns queued or tracked</p>
                    </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                    <Link href="/admin/campaigns">
                        View all <ArrowRight />
                    </Link>
                </Button>
            </CardHeader>

            <CardContent className="p-0">
                {items.length === 0 ? (
                    <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
                        <div className="flex size-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <Megaphone className="size-5" />
                        </div>
                        <p className="mt-3 text-sm font-semibold">No campaigns yet</p>
                        <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                            Create a campaign to see scheduled sends and delivery performance here.
                        </p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="px-5 text-xs font-semibold uppercase tracking-[0.12em]">
                                    Campaign
                                </TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-[0.12em]">
                                    Audience
                                </TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-[0.12em]">
                                    Status
                                </TableHead>
                                <TableHead />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((item) => {
                                const cfg = statusConfig[item.status ?? "Draft"];
                                return (
                                    <TableRow key={item.id} className="group">
                                        <TableCell className="px-5">
                                            <p className="font-semibold">{item.campaign_name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {item.templates?.template_name ?? (item.message_body ? "Custom message" : "No message selected")}
                                            </p>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="font-normal">
                                                {item.segments?.name ?? "-"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={cfg.variant} className="gap-1.5">
                                                <span className={`size-1.5 rounded-full ${cfg.dot}`} />
                                                {item.status ?? "Draft"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="pr-4">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href="/admin/campaigns">Open</Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
