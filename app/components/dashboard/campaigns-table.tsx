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
import type { CampaignItem_, CampaignStatus } from "./dashboard-data";

type CampaignsTableProps = {
    items: CampaignItem_[];
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

export function CampaignsTable({ items }: CampaignsTableProps) {
    return (
        <Card className="gap-0 py-0">
            <CardHeader className="flex-row items-center justify-between border-b px-6 py-4">
                <div>
                    <CardTitle className="text-base">Recent Campaigns</CardTitle>
                    <p className="text-xs text-muted-foreground">{items.length} campaigns</p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                    <a href="/admin/campaigns">
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
                            <TableHead className="text-xs font-semibold uppercase tracking-wide">Status</TableHead>
                            <TableHead />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map((item) => {
                            const cfg = statusConfig[item.status ?? "Draft"];
                            return (
                                <TableRow key={item.id} className="group">
                                    <TableCell className="px-6 font-medium">{item.campaign_name}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="font-normal">
                                            {item.segments?.name ?? "—"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={cfg.variant} className="gap-1.5">
                                            <span className={`size-1.5 rounded-full ${cfg.dot}`} />
                                            {item.status ?? "Draft"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="pr-4">
                                        <Button variant="outline" size="xs" asChild>
                                            <a href={`/admin/campaigns`}>View</a>
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
