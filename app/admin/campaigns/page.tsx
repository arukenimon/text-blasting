"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import {
    CalendarDays,
    MoreHorizontal,
    Pause,
    Play,
    Plus,
    Search,
    Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { DashboardLayout } from "../../components/dashboard/dashboard-layout";
import {
    CampaignItem,
    CampaignItem_,
    campaignItems,
    SegmentItem,
    segmentItems,
    TemplateItem_,
    type CampaignStatus,
} from "../../components/dashboard/dashboard-data";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSegmentsOption } from "../audience/QueryOptions";
import { getTemplatesOption } from "../templates/QueryOptions";
import { add_campaign } from "./actions";
import { getCampaignOption } from "./QueryOptions";
import moment from "moment";
import { useAuth } from "@/app/components/auth-provider";

// ─── Status config ────────────────────────────────────────────────────────────

const statusConfig: Record<
    CampaignStatus,
    {
        variant: "default" | "secondary" | "outline" | "destructive";
        dot: string;
        label: string;
    }
> = {
    Completed: { variant: "outline", dot: "bg-emerald-500", label: "Completed" },
    Running: { variant: "default", dot: "bg-blue-500", label: "Running" },
    Scheduled: { variant: "secondary", dot: "bg-amber-400", label: "Scheduled" },
    Draft: { variant: "outline", dot: "bg-muted-foreground", label: "Draft" },
    Paused: { variant: "secondary", dot: "bg-orange-400", label: "Paused" },
};

// ─── Stat helper ──────────────────────────────────────────────────────────────

function campaignStats() {
    const total = campaignItems.length;
    const active = campaignItems.filter((c) => c.status === "Running").length;
    const totalSent = campaignItems.reduce((s, c) => s + c.sent, 0);
    const completed = campaignItems.filter((c) => c.sent > 0);
    const avgDelivery = completed.length
        ? Math.round(completed.reduce((s, c) => s + (c.delivered / c.sent) * 100, 0) / completed.length)
        : 0;

    return [
        { label: "Total Campaigns", value: String(total), sub: "all time" },
        { label: "Active Now", value: String(active), sub: "running" },
        { label: "Total Sent", value: totalSent.toLocaleString(), sub: "messages" },
        { label: "Avg Delivery", value: `${avgDelivery}%`, sub: "delivery rate" },
    ];
}

// ─── Delivery bar ─────────────────────────────────────────────────────────────

function DeliveryBar({ sent, delivered }: { sent: number; delivered: number }) {
    if (sent === 0) return <span className="text-xs text-muted-foreground">—</span>;
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

// ─── New Campaign Dialog ──────────────────────────────────────────────────────

const TEMPLATES = [
    "Seasonal Offer",
    "Win-Back",
    "Welcome Series",
    "VIP Exclusive",
    "Flash Sale",
    "Cart Recovery",
    "Loyalty Reward",
];

function NewCampaignDialog({ segments, templates }: { segments: SegmentItem[], templates: TemplateItem_[] }) {
    const [open, setOpen] = useState(false);
    const [formKey, setFormKey] = useState(0);
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [sendImmediately, setSendImmediately] = useState(false);

    const [state, action, pending] = useActionState(add_campaign, undefined);

    const queryOptions = useQueryClient();
    const refreshData = async () => {
        await queryOptions.invalidateQueries({ queryKey: ["get-campaigns"] });
    }
    useEffect(() => {
        if (state?.success) {
            setOpen(false);
            refreshData();
        }
    }, [state]);

    function handleOpenChange(val: boolean) {
        setOpen(val);
        if (!val) {
            setSelectedTemplate(null);
            setSendImmediately(false);
        } else {
            setFormKey((k) => k + 1);
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <Plus />
                    New Campaign
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-lg">

                <form key={formKey} action={action}>



                    <DialogHeader>
                        <DialogTitle>Create Campaign</DialogTitle>
                        <DialogDescription>
                            Configure your text blast. You can save as a draft or schedule for later.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {/* Name */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Campaign Name</label>
                            <Input name="campaign_name" placeholder="e.g. Spring Promo Wave 2" />
                            {state?.errors?.campaign_name && (
                                <p className="text-xs text-destructive">{state.errors.campaign_name[0]}</p>
                            )}
                        </div>

                        {/* Audience + Template row */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Audience Segment</label>
                                <Select name="segment_id">
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select segment" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {segments?.map((s) => (
                                            <SelectItem key={s.name} value={s.id}>
                                                {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {state?.errors?.segment_id && (
                                    <p className="text-xs text-destructive">{state.errors.segment_id[0]}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Template</label>
                                <Select name="template_id" onValueChange={(value) => setSelectedTemplate(value)}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select template" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {templates?.map((t) => (
                                            <SelectItem key={t.template_name} value={t.id}>
                                                {t.template_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {state?.errors?.template_id && (
                                    <p className="text-xs text-destructive">{state.errors.template_id[0]}</p>
                                )}
                            </div>
                        </div>

                        {/* Message */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Message</label>
                            <Textarea
                                rows={4}
                                value={selectedTemplate ? templates.find((t) => t.id === selectedTemplate)?.body : ""}
                                placeholder="Welcome, thanks for signing up! Use code WELCOME10 for 10% off your first order."
                                className="resize-none"
                                readOnly
                            />
                            <p className="text-right text-[11px] text-muted-foreground">160 chars max</p>
                        </div>

                        {/* Schedule */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium">Schedule Date &amp; Time</label>
                                <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
                                    <Checkbox
                                        checked={sendImmediately}
                                        onCheckedChange={(checked) => setSendImmediately(!!checked)}
                                    />
                                    Send immediately
                                </label>
                            </div>
                            <input type="hidden" name="send_immediately" value={sendImmediately ? "true" : "false"} />
                            <div className={`relative transition-opacity ${sendImmediately ? "pointer-events-none opacity-40" : ""}`}>
                                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input type="datetime-local" name="schedule_time" className="pl-9" disabled={sendImmediately} />
                            </div>
                            <p className="text-[11px] text-muted-foreground">Leave blank to save as draft.</p>
                            {state?.errors?.schedule_time && (
                                <p className="text-xs text-destructive">{state.errors.schedule_time[0]}</p>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setOpen(false)}>
                            Save as Draft
                        </Button>
                        <Button type="submit">
                            Schedule Campaign
                        </Button>
                    </DialogFooter>
                </form>


            </DialogContent>
        </Dialog>
    );
}

// ─── Campaigns Page ───────────────────────────────────────────────────────────

type TabValue = "all" | Lowercase<CampaignStatus>;

export default function CampaignsPage() {
    const stats = useMemo(() => campaignStats(), []);
    const [tab, setTab] = useState<TabValue>("all");
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("newest");

    const filtered = useMemo(() => {
        let items = [...campaignItems];

        if (tab !== "all") {
            items = items.filter((c) => c.status.toLowerCase() === tab);
        }

        if (search.trim()) {
            const q = search.toLowerCase();
            items = items.filter(
                (c) =>
                    c.name.toLowerCase().includes(q) ||
                    c.audience.toLowerCase().includes(q) ||
                    c.template.toLowerCase().includes(q),
            );
        }

        if (sort === "newest") items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        if (sort === "oldest") items.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        if (sort === "sent") items.sort((a, b) => b.sent - a.sent);
        if (sort === "replies") items.sort((a, b) => b.replies - a.replies);

        return items;
    }, [tab, search, sort]);

    const counts: Record<string, number> = useMemo(() => {
        const map: Record<string, number> = { all: campaignItems.length };
        campaignItems.forEach((c) => {
            const k = c.status.toLowerCase();
            map[k] = (map[k] ?? 0) + 1;
        });
        return map;
    }, []);

    const { data: segments } = useQuery(
        getSegmentsOption()
    )

    const { data } = useQuery(getTemplatesOption());

    const { data: campaigns_ } = useQuery(getCampaignOption());

    useEffect(() => console.log("Fetched campaigns_:", campaigns_), [campaigns_]);


    //     curl -X POST -u <username>:<password> \
    //   -H "Content-Type: application/json" \
    //   -d '{ "textMessage": { "text": "Hello, doctors!" }, "phoneNumbers": ["+19162255887", "+19162255888"] }' \
    //   https://api.sms-gate.app/3rdparty/v1/message

    const sendTestBlast = async ({ item }: { item: CampaignItem_ }) => {
        try {
            const response = await fetch('/api/send-sms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    textMessage: { text: "Hello, doctorsxx!" },
                    phoneNumbers: ["+639273630590"],
                    simNumber: 2
                })
            });
            const data = await response.json();
            console.log("Test blast response:", data);
        } catch (error) {
            console.error("Error sending test blast:", error);
        }
    }

    const { user } = useAuth();

    useEffect(() => console.log('user:', user), [user]);

    return (
        <DashboardLayout>
            {/* Page header */}
            <div className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                        Text Blasting
                    </p>
                    <h1 className="mt-0.5 text-2xl font-semibold tracking-tight">Campaigns</h1>
                </div>
                <NewCampaignDialog segments={segments as SegmentItem[]} templates={data as TemplateItem_[]} />
            </div>

            <div className="mt-6 space-y-5">
                {/* Stat cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {stats.map((s) => (
                        <Card key={s.label} className="py-4">
                            <CardHeader className="px-5 pb-1 pt-0">
                                <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    {s.label}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-5">
                                <p className="text-2xl font-bold tabular-nums">{s.value}</p>
                                <p className="text-xs text-muted-foreground">{s.sub}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Filter bar */}
                <Card className="gap-0 py-0">
                    <div className="flex flex-col gap-3 border-b px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                        {/* Tabs */}
                        <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
                            <TabsList className="h-8">
                                {(
                                    [
                                        ["all", "All"],
                                        ["running", "Running"],
                                        ["scheduled", "Scheduled"],
                                        ["completed", "Completed"],
                                        ["draft", "Draft"],
                                        ["paused", "Paused"],
                                    ] as [TabValue, string][]
                                ).map(([value, label]) => (
                                    <TabsTrigger key={value} value={value} className="h-7 gap-1.5 px-3 text-xs">
                                        {label}
                                        {counts[value] !== undefined && (
                                            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                                                {counts[value]}
                                            </span>
                                        )}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </Tabs>

                        {/* Search + sort */}
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search campaigns…"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="h-8 w-48 pl-8 text-xs"
                                />
                            </div>
                            <Select value={sort} onValueChange={setSort}>
                                <SelectTrigger className="h-8 w-36 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="newest">Newest first</SelectItem>
                                    <SelectItem value="oldest">Oldest first</SelectItem>
                                    <SelectItem value="sent">Most sent</SelectItem>
                                    <SelectItem value="replies">Most replies</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Table */}
                    <CardContent className="p-0">
                        {filtered.length === 0 && campaigns_?.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
                                <Search className="size-8 opacity-30" />
                                <p className="text-sm font-medium">No campaigns found</p>
                                <p className="text-xs">Try adjusting your search or filters.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/40">
                                        <TableHead className="px-6 text-xs font-semibold uppercase tracking-wide">
                                            Campaign
                                        </TableHead>
                                        <TableHead className="text-xs font-semibold uppercase tracking-wide">Audience</TableHead>
                                        <TableHead className="text-xs font-semibold uppercase tracking-wide">Template</TableHead>
                                        <TableHead className="text-xs font-semibold uppercase tracking-wide">Sent</TableHead>
                                        <TableHead className="text-xs font-semibold uppercase tracking-wide">Delivery</TableHead>
                                        <TableHead className="text-xs font-semibold uppercase tracking-wide">Replies</TableHead>
                                        <TableHead className="text-xs font-semibold uppercase tracking-wide">Opt-outs</TableHead>
                                        <TableHead className="text-xs font-semibold uppercase tracking-wide">Status</TableHead>
                                        <TableHead className="text-xs font-semibold uppercase tracking-wide">Scheduled</TableHead>
                                        <TableHead className="text-xs font-semibold uppercase tracking-wide">Actions</TableHead>
                                        <TableHead />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered?.map((item) => {
                                        const cfg = statusConfig[item.status];
                                        return (
                                            <TableRow key={item.id} className="group">
                                                <TableCell className="px-6">
                                                    <p className="font-medium">{item.name}</p>
                                                    <p className="text-[11px] text-muted-foreground">
                                                        Created {item.createdAt}
                                                    </p>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className="font-normal">
                                                        {item.audience}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {item.template}
                                                </TableCell>
                                                <TableCell className="tabular-nums">
                                                    {item.sent > 0 ? item.sent.toLocaleString() : <span className="text-muted-foreground">—</span>}
                                                </TableCell>
                                                <TableCell>
                                                    <DeliveryBar sent={item.sent} delivered={item.delivered} />
                                                </TableCell>
                                                <TableCell className="tabular-nums text-muted-foreground">
                                                    {item.replies > 0 ? item.replies.toLocaleString() : "—"}
                                                </TableCell>
                                                <TableCell className="tabular-nums text-muted-foreground">
                                                    {item.optOuts > 0 ? item.optOuts.toLocaleString() : "—"}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={cfg.variant} className="gap-1.5">
                                                        <span className={`size-1.5 rounded-full ${cfg.dot}`} />
                                                        {cfg.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {item.scheduledAt}
                                                </TableCell>
                                                <TableCell >
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon-xs"
                                                                className="invisible group-hover:visible"
                                                                aria-label="Campaign actions"
                                                            >
                                                                <MoreHorizontal />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-44">
                                                            <DropdownMenuItem>View Details</DropdownMenuItem>
                                                            <DropdownMenuItem>Edit Campaign</DropdownMenuItem>
                                                            <DropdownMenuItem>Duplicate</DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            {item.status === "Running" && (
                                                                <DropdownMenuItem>
                                                                    <Pause className="size-3.5" />
                                                                    Pause Campaign
                                                                </DropdownMenuItem>
                                                            )}
                                                            {item.status === "Paused" && (
                                                                <DropdownMenuItem>
                                                                    <Play className="size-3.5" />
                                                                    Resume Campaign
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="text-destructive focus:text-destructive">
                                                                <Trash2 className="size-3.5" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {campaigns_?.map((item: CampaignItem_) => {
                                        const cfg = statusConfig['Scheduled'];
                                        return (
                                            <TableRow key={item.id} className="group">
                                                <TableCell className="px-6">
                                                    <p className="font-medium">{item.campaign_name}</p>
                                                    <p className="text-[11px] text-muted-foreground">
                                                        Created {moment(item.created_at).format('MMM DD, YYYY')}
                                                    </p>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className="font-normal">
                                                        {item.segments.name}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {item.templates.template_name}
                                                </TableCell>
                                                <TableCell className="tabular-nums">
                                                    {/* {item.sent > 0 ? item.sent.toLocaleString() : <span className="text-muted-foreground">—</span>} */}
                                                </TableCell>
                                                <TableCell>
                                                    {/* <DeliveryBar sent={item.sent} delivered={item.delivered} /> */}
                                                </TableCell>
                                                <TableCell className="tabular-nums text-muted-foreground">
                                                    {/* {item.replies > 0 ? item.replies.toLocaleString() : "—"} */}
                                                </TableCell>
                                                <TableCell className="tabular-nums text-muted-foreground">
                                                    {/* {item.optOuts > 0 ? item.optOuts.toLocaleString() : "—"} */}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={cfg.variant} className="gap-1.5">
                                                        <span className={`size-1.5 rounded-full ${cfg.dot}`} />
                                                        {cfg.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {moment(item.scheduled_date).format('MMM DD, YYYY h:mm A')}
                                                </TableCell>
                                                <TableCell className="pr-4">
                                                    {/* Make it smaller */}
                                                    <Button className="">Send Immediately</Button>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon-xs"
                                                                className="invisible group-hover:visible"
                                                                aria-label="Campaign actions"
                                                            >
                                                                <MoreHorizontal />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-44">
                                                            <DropdownMenuItem>View Details</DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => sendTestBlast({ item })}>Edit Campaign</DropdownMenuItem>
                                                            <DropdownMenuItem>Duplicate</DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            {/* {item.status === "Running" && (
                                                                <DropdownMenuItem>
                                                                    <Pause className="size-3.5" />
                                                                    Pause Campaign
                                                                </DropdownMenuItem>
                                                            )}
                                                            {item.status === "Paused" && (
                                                                <DropdownMenuItem>
                                                                    <Play className="size-3.5" />
                                                                    Resume Campaign
                                                                </DropdownMenuItem>
                                                            )} */}
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="text-destructive focus:text-destructive">
                                                                <Trash2 className="size-3.5" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
