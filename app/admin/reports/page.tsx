"use client";

import { useMemo, useState, type CSSProperties, type ElementType } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    BarChart3,
    CheckCircle2,
    Send,
    TrendingDown,
    TrendingUp,
    TriangleAlert,
    Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/app/components/dashboard/dashboard-layout";
import { Topbar } from "@/app/components/dashboard/topbar";
import { useAuth } from "@/app/components/auth-provider";
import { useMessagesRealtime } from "@/lib/realtime/messages";
import {
    getReportsOption,
    type ReportBucket,
    type ReportRange,
    type ReportSummaryItem,
} from "./QueryOptions";

const rangeLabels: Record<ReportRange, string> = {
    "7d": "7 days",
    "30d": "30 days",
    "90d": "90 days",
};

const summaryIcons: Record<string, ElementType> = {
    "Messages Sent": Send,
    "Delivery Rate": CheckCircle2,
    "Failure Rate": TriangleAlert,
};

function EmptyState({ title, body }: { title: string; body: string }) {
    return (
        <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <div className="flex size-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <BarChart3 className="size-5" />
            </div>
            <p className="mt-3 text-sm font-semibold">{title}</p>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">{body}</p>
        </div>
    );
}

function SummaryCards({ items }: { items: ReportSummaryItem[] }) {
    return (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => {
                const Icon = summaryIcons[item.label] ?? BarChart3;
                const TrendIcon = item.positive ? TrendingUp : TrendingDown;
                return (
                    <Card key={item.label} className="py-0">
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                        {item.label}
                                    </p>
                                    <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">
                                        {item.value}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
                                </div>
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <Icon className="size-4" />
                                </div>
                            </div>
                            <div className="mt-5 flex items-center gap-1.5 border-t pt-3">
                                <TrendIcon
                                    className={`size-3.5 ${item.positive ? "text-emerald-600" : "text-destructive"}`}
                                />
                                <p className={`text-xs font-semibold ${item.positive ? "text-emerald-700" : "text-destructive"}`}>
                                    {item.change}
                                </p>
                                <p className="text-xs text-muted-foreground">vs previous period</p>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </section>
    );
}

function VolumeChart({ buckets }: { buckets: ReportBucket[] }) {
    const maxValue = Math.max(1, ...buckets.map((bucket) => bucket.sent + bucket.failed));
    const hasData = buckets.some((bucket) => bucket.sent || bucket.delivered || bucket.failed);

    return (
        <Card className="gap-0 overflow-hidden py-0">
            <CardHeader className="border-b px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <CardTitle className="text-base">Message Volume</CardTitle>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Sent, delivered, and failed outbound messages by period.
                        </p>
                    </div>
                    <Badge variant="secondary" className="font-normal">Live from messages</Badge>
                </div>
            </CardHeader>
            <CardContent className="p-5">
                {!hasData ? (
                    <EmptyState
                        title="No message activity yet"
                        body="Once campaigns send, outbound volume trends will appear here."
                    />
                ) : (
                    <div className="space-y-5">
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-primary" /> Sent</span>
                            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-emerald-500" /> Delivered</span>
                            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-destructive" /> Failed</span>
                        </div>
                        <div className="grid min-h-64 grid-cols-[repeat(var(--bucket-count),minmax(18px,1fr))] items-end gap-2" style={{ "--bucket-count": buckets.length } as CSSProperties}>
                            {buckets.map((bucket, index) => {
                                const sentHeight = Math.max(4, (bucket.sent / maxValue) * 100);
                                const deliveredHeight = Math.max(4, (bucket.delivered / maxValue) * 100);
                                const failedHeight = Math.max(4, (bucket.failed / maxValue) * 100);
                                return (
                                    <div key={`${bucket.label}-${index}`} className="flex min-w-0 flex-col items-center gap-2">
                                        <div className="flex h-52 w-full max-w-16 items-end justify-center gap-1 rounded-md border bg-muted/20 px-1 pb-1">
                                            <span className="w-2 rounded-t bg-primary" style={{ height: `${bucket.sent ? sentHeight : 0}%` }} />
                                            <span className="w-2 rounded-t bg-emerald-500" style={{ height: `${bucket.delivered ? deliveredHeight : 0}%` }} />
                                            <span className="w-2 rounded-t bg-destructive" style={{ height: `${bucket.failed ? failedHeight : 0}%` }} />
                                        </div>
                                        <p className="truncate text-[11px] text-muted-foreground">{bucket.label}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function StatusBreakdown({
    items,
}: {
    items: { label: string; value: number; color: string }[];
}) {
    const total = items.reduce((sum, item) => sum + item.value, 0);

    return (
        <Card className="gap-0 py-0">
            <CardHeader className="border-b px-5 py-4">
                <CardTitle className="text-base">Delivery Status</CardTitle>
                <p className="text-xs text-muted-foreground">Outbound message states in the selected period.</p>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
                {items.map((item) => {
                    const pct = total ? Math.round((item.value / total) * 100) : 0;
                    return (
                        <div key={item.label} className="space-y-1.5">
                            <div className="flex items-center justify-between gap-3 text-sm">
                                <span className="font-medium">{item.label}</span>
                                <span className="tabular-nums text-muted-foreground">{item.value.toLocaleString()} · {pct}%</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-muted">
                                <div className={`h-full rounded-full ${item.color}`} style={{ width: `${pct}%` }} />
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}

function AudienceHealth({
    health,
}: {
    health: { total: number; subscribed: number; optedOut: number; undeliverable: number; optOutRate: number };
}) {
    const subscribedPct = health.total ? Math.round((health.subscribed / health.total) * 100) : 0;
    const optedOutPct = health.total ? Math.round((health.optedOut / health.total) * 100) : 0;
    const undeliverablePct = health.total ? Math.round((health.undeliverable / health.total) * 100) : 0;

    return (
        <Card className="gap-0 py-0">
            <CardHeader className="border-b px-5 py-4">
                <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-sky-500/10 text-sky-700">
                        <Users className="size-4" />
                    </div>
                    <div>
                        <CardTitle className="text-base">Audience Health</CardTitle>
                        <p className="text-xs text-muted-foreground">{health.total.toLocaleString()} total contacts</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
                <div className="h-3 overflow-hidden rounded-full bg-muted">
                    <div className="float-left h-full bg-emerald-500" style={{ width: `${subscribedPct}%` }} />
                    <div className="float-left h-full bg-amber-500" style={{ width: `${optedOutPct}%` }} />
                    <div className="float-left h-full bg-destructive" style={{ width: `${undeliverablePct}%` }} />
                </div>
                <div className="grid gap-3 text-sm sm:grid-cols-3">
                    <div>
                        <p className="font-semibold tabular-nums">{health.subscribed.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Subscribed</p>
                    </div>
                    <div>
                        <p className="font-semibold tabular-nums">{health.optedOut.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Opted out · {health.optOutRate}%</p>
                    </div>
                    <div>
                        <p className="font-semibold tabular-nums">{health.undeliverable.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Undeliverable</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function TopCampaigns({
    items,
}: {
    items: {
        id: number;
        name: string;
        audience: string;
        status: string;
        sent: number;
        delivered: number;
        failed: number;
        deliveryRate: number;
    }[];
}) {
    return (
        <Card className="gap-0 overflow-hidden py-0">
            <CardHeader className="border-b px-5 py-4">
                <CardTitle className="text-base">Top Campaigns</CardTitle>
                <p className="text-xs text-muted-foreground">Ranked by sent volume in the selected period.</p>
            </CardHeader>
            <CardContent className="p-0">
                {items.length === 0 ? (
                    <EmptyState
                        title="No campaign performance yet"
                        body="Campaign performance appears after tracked messages are created."
                    />
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="px-5 text-xs font-semibold uppercase tracking-[0.12em]">Campaign</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-[0.12em]">Audience</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-[0.12em]">Sent</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-[0.12em]">Delivery</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-[0.12em]">Failed</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="px-5">
                                        <p className="font-semibold">{item.name}</p>
                                        <p className="text-xs text-muted-foreground">{item.status}</p>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="font-normal">{item.audience}</Badge>
                                    </TableCell>
                                    <TableCell className="tabular-nums">{item.sent.toLocaleString()}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                                                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${item.deliveryRate}%` }} />
                                            </div>
                                            <span className="text-xs tabular-nums text-muted-foreground">{item.deliveryRate}%</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="tabular-nums">{item.failed.toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}

export default function ReportsPage() {
    const [range, setRange] = useState<ReportRange>("30d");
    const { activeWorkspace } = useAuth();
    const workspaceId = activeWorkspace?.id;
    const additionalKeys = useMemo(() => [["reports", workspaceId, range]], [workspaceId, range]);
    useMessagesRealtime({ workspaceId, additionalKeys });
    const { data, isLoading, error } = useQuery(getReportsOption(workspaceId, range));

    return (
        <DashboardLayout>
            <Topbar />
            <div className="mt-6 space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm font-semibold">Performance reports</p>
                        <p className="text-xs text-muted-foreground">
                            {data?.rangeLabel ?? "Choose a range"} · updates as delivery webhooks arrive
                        </p>
                    </div>
                    <Tabs value={range} onValueChange={(value) => setRange(value as ReportRange)}>
                        <TabsList>
                            {(Object.keys(rangeLabels) as ReportRange[]).map((value) => (
                                <TabsTrigger key={value} value={value}>{rangeLabels[value]}</TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                </div>

                {error ? (
                    <Card>
                        <CardContent className="p-5 text-sm text-destructive">
                            {error instanceof Error ? error.message : "Failed to load reports."}
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <SummaryCards items={data?.summary ?? [
                            { label: "Messages Sent", value: "0", detail: "Loading", change: "0%", positive: true },
                            { label: "Delivery Rate", value: "0%", detail: "Loading", change: "0 pts", positive: true },
                            { label: "Failure Rate", value: "0%", detail: "Loading", change: "0 pts", positive: true },
                        ]} />

                        {isLoading && !data ? (
                            <Card>
                                <CardContent className="p-5 text-sm text-muted-foreground">Loading report data...</CardContent>
                            </Card>
                        ) : data ? (
                            <>
                                <VolumeChart buckets={data.buckets} />
                                <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
                                    <StatusBreakdown items={data.statusBreakdown} />
                                    <AudienceHealth health={data.audienceHealth} />
                                </section>
                                <TopCampaigns items={data.topCampaigns} />
                            </>
                        ) : null}
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}
