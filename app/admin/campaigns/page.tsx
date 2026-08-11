"use client";

import { useActionState, useDeferredValue, useEffect, useMemo, useState } from "react";
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Clock,
    MessageSquareText,
    MoreHorizontal,
    Search,
    Send,
    Trash2,
    Users,
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
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
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
    CampaignItem_,
    SegmentItem,
    TemplateItem_,
    type CampaignStatus,
} from "../../components/dashboard/dashboard-data";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSegmentsOption } from "../audience/QueryOptions";
import { getTemplatesOption } from "../templates/QueryOptions";
import { add_campaign, delete_campaign, send_campaign, update_campaign } from "./actions";
import {
    getAudiencePreviewContactsOption,
    getCampaignPageOption,
    getCampaignStatsOption,
    getCampaignStatusCountsOption,
} from "./QueryOptions";
import moment from "moment";
import { useMessagesRealtime } from "@/lib/realtime/messages";
import { useAuth } from "@/app/components/auth-provider";

const statusConfig: Record<
    CampaignStatus,
    { variant: "default" | "secondary" | "outline" | "destructive"; dot: string; label: string }
> = {
    Completed: { variant: "outline", dot: "bg-emerald-500", label: "Completed" },
    Running: { variant: "default", dot: "bg-blue-500", label: "Running" },
    Scheduled: { variant: "secondary", dot: "bg-amber-400", label: "Scheduled" },
    Draft: { variant: "outline", dot: "bg-muted-foreground", label: "Draft" },
    Paused: { variant: "secondary", dot: "bg-orange-400", label: "Paused" },
};

const SMS_SEGMENT_LENGTH = 160;
const PAGE_SIZE_OPTIONS = [10, 25, 50];

function getContactCount(segment?: SegmentItem) {
    const count = segment?.contacts?.[0]?.count;
    return typeof count === "number" ? count : 0;
}

function formatCount(value: number) {
    return value > 0 ? value.toLocaleString() : "—";
}

function DeliveryBar({ total, delivered }: { total: number; delivered: number }) {
    if (total === 0) return <span className="text-xs text-muted-foreground">—</span>;
    const pct = Math.round((delivered / total) * 100);
    return (
        <div className="flex items-center gap-2">
            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
            </div>
            <span className="tabular-nums text-xs text-muted-foreground">{pct}%</span>
        </div>
    );
}

function CampaignAudienceCell({
    segment,
    workspaceId,
}: {
    segment?: SegmentItem;
    workspaceId?: string | null;
}) {
    const [open, setOpen] = useState(false);
    const { data: preview, isFetching } = useQuery(
        getAudiencePreviewContactsOption({
            workspaceId,
            segmentId: segment?.id,
            enabled: open,
        })
    );
    const contactCount = preview?.count ?? getContactCount(segment);
    const visibleContacts = preview?.data ?? [];
    const remainingContacts = Math.max(0, contactCount - visibleContacts.length);

    return (
        <HoverCard open={open} onOpenChange={setOpen}>
            <HoverCardTrigger asChild>
                <Badge asChild variant="secondary" className="font-normal">
                    <button type="button" className="cursor-help">
                        {segment?.name ?? "—"}
                    </button>
                </Badge>
            </HoverCardTrigger>
            <HoverCardContent align="start" className="w-80">
                <div className="space-y-3">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                            Audience
                        </p>
                        <p className="mt-1 text-sm font-semibold">{segment?.name ?? "No audience"}</p>
                        <p className="text-xs text-muted-foreground">
                            {contactCount.toLocaleString()} contact{contactCount === 1 ? "" : "s"}
                        </p>
                    </div>
                    {isFetching ? (
                        <p className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                            Loading audience preview...
                        </p>
                    ) : visibleContacts.length > 0 ? (
                        <div className="space-y-2">
                            {visibleContacts.map((contact) => (
                                <div
                                    key={contact.id}
                                    className="rounded-md border bg-muted/30 px-3 py-2"
                                >
                                    <p className="truncate text-sm font-medium">
                                        {contact.full_name || "Unnamed contact"}
                                    </p>
                                    <p className="text-xs tabular-nums text-muted-foreground">
                                        {String(contact.phone_no)}
                                    </p>
                                </div>
                            ))}
                            {remainingContacts > 0 && (
                                <p className="text-xs text-muted-foreground">
                                    +{remainingContacts.toLocaleString()} more contact
                                    {remainingContacts === 1 ? "" : "s"}
                                </p>
                            )}
                        </div>
                    ) : (
                        <p className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                            {contactCount > 0
                                ? "No contact preview is available for this audience."
                                : "No contacts are assigned to this audience."}
                        </p>
                    )}
                </div>
            </HoverCardContent>
        </HoverCard>
    );
}

function CampaignMessageCell({ campaign }: { campaign: CampaignItem_ }) {
    const isTemplate = Boolean(campaign.templates?.template_name);
    const label = campaign.templates?.template_name ?? (campaign.message_body ? "Custom message" : "—");
    const body = (campaign.message_body ?? campaign.templates?.body ?? "").trim();
    const characterCount = body.length;
    const smsParts = body ? Math.max(1, Math.ceil(characterCount / SMS_SEGMENT_LENGTH)) : 0;

    return (
        <HoverCard>
            <HoverCardTrigger asChild>
                <button
                    type="button"
                    className="max-w-44 cursor-help truncate text-left text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
                >
                    {label}
                </button>
            </HoverCardTrigger>
            <HoverCardContent align="start" className="w-96">
                <div className="space-y-3">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                            Message
                        </p>
                        <p className="mt-1 text-sm font-semibold">{label}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            <Badge variant="secondary" className="font-normal">
                                {isTemplate ? "Template" : "Custom"}
                            </Badge>
                            <Badge variant="outline" className="font-normal">
                                {characterCount.toLocaleString()} chars
                            </Badge>
                            {smsParts > 0 && (
                                <Badge variant="outline" className="font-normal">
                                    {smsParts} SMS part{smsParts === 1 ? "" : "s"}
                                </Badge>
                            )}
                        </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto rounded-md border bg-muted/30 p-3">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                            {body || "No message body saved for this campaign."}
                        </p>
                    </div>
                </div>
            </HoverCardContent>
        </HoverCard>
    );
}

function NewCampaignDialog({
    segments,
    templates,
}: {
    segments: SegmentItem[];
    templates: TemplateItem_[];
}) {
    const [open, setOpen] = useState(false);
    const [formKey, setFormKey] = useState(0);
    const [selectedSegmentId, setSelectedSegmentId] = useState("");
    const [selectedTemplateId, setSelectedTemplateId] = useState("");
    const [messageMode, setMessageMode] = useState<"template" | "custom">("template");
    const [customMessage, setCustomMessage] = useState("");
    const [sendImmediately, setSendImmediately] = useState(true);
    const [scheduleTime, setScheduleTime] = useState("");
    const [state, action, pending] = useActionState(add_campaign, undefined);
    const queryClient = useQueryClient();

    const selectedSegment = segments.find((s) => s.id === selectedSegmentId);
    const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);
    const messageBody = messageMode === "template" ? selectedTemplate?.body ?? "" : customMessage;
    const contactCount = getContactCount(selectedSegment);
    const smsParts = Math.max(1, Math.ceil(messageBody.length / SMS_SEGMENT_LENGTH));
    const hasMessage = messageBody.trim().length > 0;
    const canSubmit = Boolean(
        selectedSegmentId &&
        hasMessage &&
        (messageMode === "custom" || selectedTemplateId) &&
        (sendImmediately || scheduleTime)
    );
    const campaignName =
        messageMode === "template" && selectedTemplate && selectedSegment
            ? `${selectedTemplate.template_name} to ${selectedSegment.name} - ${moment().format("MMM D, h:mm A")}`
            : selectedSegment
                ? `Custom message to ${selectedSegment.name} - ${moment().format("MMM D, h:mm A")}`
                : `Text blast - ${moment().format("MMM D, h:mm A")}`;

    useEffect(() => {
        if (state?.success) {
            queryClient.invalidateQueries({ queryKey: ["get-campaigns"] });
            queryClient.invalidateQueries({ queryKey: ["campaign-status-counts"] });
            queryClient.invalidateQueries({ queryKey: ["campaign-stats"] });
            const timer = window.setTimeout(() => setOpen(false), 0);
            return () => window.clearTimeout(timer);
        }
    }, [state, queryClient]);

    function handleOpenChange(val: boolean) {
        setOpen(val);
        if (!val) {
            setSelectedSegmentId("");
            setSelectedTemplateId("");
            setMessageMode("template");
            setCustomMessage("");
            setSendImmediately(true);
            setScheduleTime("");
        } else {
            setFormKey((k) => k + 1);
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <Send />
                    Send Message
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <form key={formKey} action={action}>
                    <DialogHeader>
                        <DialogTitle>Send Message</DialogTitle>
                        <DialogDescription>
                            Choose an audience, then use a template or type a message directly.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-3">
                        <input type="hidden" name="campaign_name" value={campaignName} />
                        <input type="hidden" name="message_mode" value={messageMode} />
                        <input type="hidden" name="message_body" value={messageBody} />
                        <div className="grid gap-3 md:grid-cols-2">
                            <div className="space-y-1.5">
                                <label className="flex items-center gap-2 text-sm font-medium">
                                    <Users className="size-4 text-muted-foreground" />
                                    Audience
                                </label>
                                <Select name="segment_id" value={selectedSegmentId} onValueChange={setSelectedSegmentId}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Choose audience" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {segments?.map((s) => (
                                            <SelectItem key={s.id} value={s.id}>
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
                                <label className="flex items-center gap-2 text-sm font-medium">
                                    <MessageSquareText className="size-4 text-muted-foreground" />
                                    Message
                                </label>
                                <Tabs
                                    value={messageMode}
                                    onValueChange={(value) => setMessageMode(value as "template" | "custom")}
                                >
                                    <TabsList className="grid h-9 w-full grid-cols-2">
                                        <TabsTrigger value="template">Template</TabsTrigger>
                                        <TabsTrigger value="custom">Custom</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>
                        </div>
                        {messageMode === "template" && (
                            <div className="space-y-1.5">
                                <Select
                                    name="template_id"
                                    value={selectedTemplateId}
                                    onValueChange={setSelectedTemplateId}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Choose template" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {templates?.map((t) => (
                                            <SelectItem key={`${t.template_name}-${t.id}`} value={t.id}>
                                                {t.template_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {state?.errors?.template_id && (
                                    <p className="text-xs text-destructive">{state.errors.template_id[0]}</p>
                                )}
                            </div>
                        )}
                        <div className="rounded-md border bg-muted/30 p-3">
                            <Textarea
                                rows={5}
                                value={messageBody}
                                onChange={(e) => setCustomMessage(e.target.value)}
                                placeholder={
                                    messageMode === "template"
                                        ? "Pick a template to preview the message."
                                        : "Type the message you want to send."
                                }
                                className="resize-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                                readOnly={messageMode === "template"}
                            />
                            {state?.errors?.message_body && (
                                <p className="mt-2 text-xs text-destructive">{state.errors.message_body[0]}</p>
                            )}
                            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <Badge variant="secondary" className="font-normal">
                                    {contactCount.toLocaleString()} contacts
                                </Badge>
                                <Badge variant="outline" className="font-normal">
                                    {messageBody.length} chars
                                </Badge>
                                <Badge variant="outline" className="font-normal">
                                    {smsParts} SMS part{smsParts === 1 ? "" : "s"}
                                </Badge>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-sm font-medium">Delivery</label>
                            <input
                                type="hidden"
                                name="send_immediately"
                                value={sendImmediately ? "true" : "false"}
                            />
                            <div className="grid gap-2 sm:grid-cols-2">
                                <button
                                    type="button"
                                    className={`flex items-center gap-3 rounded-md border p-3 text-left transition-colors ${
                                        sendImmediately
                                            ? "border-primary bg-primary/5 text-primary"
                                            : "bg-background hover:bg-muted/50"
                                    }`}
                                    onClick={() => setSendImmediately(true)}
                                >
                                    <Send className="size-4" />
                                    <span>
                                        <span className="block text-sm font-medium">Send now</span>
                                        <span className="block text-xs text-muted-foreground">Start delivery right away</span>
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    className={`flex items-center gap-3 rounded-md border p-3 text-left transition-colors ${
                                        !sendImmediately
                                            ? "border-primary bg-primary/5 text-primary"
                                            : "bg-background hover:bg-muted/50"
                                    }`}
                                    onClick={() => setSendImmediately(false)}
                                >
                                    <Clock className="size-4" />
                                    <span>
                                        <span className="block text-sm font-medium">Schedule</span>
                                        <span className="block text-xs text-muted-foreground">Pick a later date and time</span>
                                    </span>
                                </button>
                            </div>
                            {!sendImmediately && (
                                <div className="relative">
                                    <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        type="datetime-local"
                                        name="schedule_time"
                                        value={scheduleTime}
                                        onChange={(e) => setScheduleTime(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            )}
                            {state?.errors?.schedule_time && (
                                <p className="text-xs text-destructive">{state.errors.schedule_time[0]}</p>
                            )}
                            {state?.errors?._dispatch && (
                                <p className="text-xs text-amber-600">{state.errors._dispatch[0]}</p>
                            )}
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" type="button" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={pending || !canSubmit}>
                            {pending ? "Saving..." : sendImmediately ? "Send Now" : "Schedule"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function EditCampaignDialog({
    campaign,
    segments,
    templates,
    open,
    onOpenChange,
}: {
    campaign: CampaignItem_;
    segments: SegmentItem[];
    templates: TemplateItem_[];
    open: boolean;
    onOpenChange: (val: boolean) => void;
}) {
    const queryClient = useQueryClient();
    const [sendImmediately, setSendImmediately] = useState(false);
    const [messageMode, setMessageMode] = useState<"template" | "custom">(
        campaign.message_body ? "custom" : "template"
    );
    const [selectedTemplateId, setSelectedTemplateId] = useState(campaign.template_id ?? "");
    const [customMessage, setCustomMessage] = useState(campaign.message_body ?? "");
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const messageBody = messageMode === "template"
        ? templates.find((t) => t.id === selectedTemplateId)?.body ?? ""
        : customMessage;

    const scheduledValue = campaign.scheduled_date
        ? new Date(campaign.scheduled_date).toISOString().slice(0, 16)
        : "";

    const { mutate, isPending } = useMutation({
        mutationFn: (formData: FormData) => update_campaign(campaign.id, formData),
        onSuccess: (result) => {
            if (result.success) {
                queryClient.invalidateQueries({ queryKey: ["get-campaigns"] });
                queryClient.invalidateQueries({ queryKey: ["campaign-status-counts"] });
                onOpenChange(false);
            } else {
                setErrors(result.errors);
            }
        },
    });

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setErrors({});
        mutate(new FormData(e.currentTarget));
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Edit Campaign</DialogTitle>
                        <DialogDescription>
                            Update your campaign details. Changes won&apos;t affect messages already sent.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <input type="hidden" name="message_mode" value={messageMode} />
                        <input type="hidden" name="message_body" value={messageBody} />
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Campaign Name</label>
                            <Input
                                name="campaign_name"
                                defaultValue={campaign.campaign_name}
                                placeholder="e.g. Spring Promo Wave 2"
                            />
                            {errors.campaign_name && (
                                <p className="text-xs text-destructive">{errors.campaign_name[0]}</p>
                            )}
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Audience Segment</label>
                                <Select name="segment_id" defaultValue={campaign.segment_id}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select segment" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {segments?.map((s) => (
                                            <SelectItem key={s.id} value={s.id}>
                                                {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.segment_id && (
                                    <p className="text-xs text-destructive">{errors.segment_id[0]}</p>
                                )}
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Message</label>
                                <Tabs
                                    value={messageMode}
                                    onValueChange={(value) => setMessageMode(value as "template" | "custom")}
                                >
                                    <TabsList className="grid h-9 w-full grid-cols-2">
                                        <TabsTrigger value="template">Template</TabsTrigger>
                                        <TabsTrigger value="custom">Custom</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>
                        </div>
                        {messageMode === "template" && (
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Template</label>
                                <Select
                                    name="template_id"
                                    value={selectedTemplateId}
                                    onValueChange={setSelectedTemplateId}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select template" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {templates?.map((t) => (
                                            <SelectItem key={t.id} value={t.id}>
                                                {t.template_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.template_id && (
                                    <p className="text-xs text-destructive">{errors.template_id[0]}</p>
                                )}
                            </div>
                        )}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Message</label>
                            <Textarea
                                rows={4}
                                value={messageBody}
                                onChange={(e) => setCustomMessage(e.target.value)}
                                placeholder={
                                    messageMode === "template"
                                        ? "Select a template to preview the message."
                                        : "Type the message you want to send."
                                }
                                className="resize-none"
                                readOnly={messageMode === "template"}
                            />
                            {errors.message_body && (
                                <p className="text-xs text-destructive">{errors.message_body[0]}</p>
                            )}
                        </div>
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
                            <input
                                type="hidden"
                                name="send_immediately"
                                value={sendImmediately ? "true" : "false"}
                            />
                            <div
                                className={`relative transition-opacity ${
                                    sendImmediately ? "pointer-events-none opacity-40" : ""
                                }`}
                            >
                                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    type="datetime-local"
                                    name="schedule_time"
                                    className="pl-9"
                                    defaultValue={scheduledValue}
                                    disabled={sendImmediately}
                                />
                            </div>
                            {errors.schedule_time && (
                                <p className="text-xs text-destructive">{errors.schedule_time[0]}</p>
                            )}
                        </div>
                        {errors.form && <p className="text-xs text-destructive">{errors.form[0]}</p>}
                    </div>
                    <DialogFooter className="gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? "Saving…" : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

type TabValue = "all" | Lowercase<CampaignStatus>;

export default function CampaignsPage() {
    const { activeWorkspace } = useAuth();
    const workspaceId = activeWorkspace?.id;
    const [tab, setTab] = useState<TabValue>("all");
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("newest");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
    const [editingCampaign, setEditingCampaign] = useState<CampaignItem_ | null>(null);
    const queryClient = useQueryClient();
    const deferredSearch = useDeferredValue(search);

    useMessagesRealtime({ workspaceId }); // live update for campaign delivery stats

    const { data: segments } = useQuery(getSegmentsOption(workspaceId));
    const { data: templatesData } = useQuery(getTemplatesOption(workspaceId));
    const { data: campaignPage, isFetching: isFetchingCampaigns } = useQuery(
        getCampaignPageOption({
            workspaceId,
            page,
            pageSize,
            tab,
            search: deferredSearch,
            sort,
        })
    );
    const { data: statusCounts } = useQuery(getCampaignStatusCountsOption(workspaceId));
    const { data: stats } = useQuery(getCampaignStatsOption(workspaceId));
    const campaigns = useMemo(() => (campaignPage?.data ?? []) as CampaignItem_[], [campaignPage?.data]);
    const totalCampaigns = campaignPage?.count ?? 0;
    const pageCount = Math.max(1, Math.ceil(totalCampaigns / pageSize));
    const pageStart = totalCampaigns === 0 ? 0 : (page - 1) * pageSize + 1;
    const pageEnd = Math.min(page * pageSize, totalCampaigns);

    const statsMap = useMemo(() => stats ?? {}, [stats]);
    const counts: Record<string, number> = useMemo(
        () => statusCounts ?? { all: totalCampaigns },
        [statusCounts, totalCampaigns]
    );
    const totalsByStatus = useMemo(() => {
        const acc = { total: counts.all ?? 0, attempted: 0, inProgress: 0, delivered: 0, failed: 0 };
        Object.values(statsMap).forEach((s) => {
            acc.attempted += s.total;
            acc.inProgress += s.pending + s.queued + s.sent;
            acc.delivered += s.delivered;
            acc.failed += s.failed;
        });
        return acc;
    }, [counts, statsMap]);
    const avgDelivery = totalsByStatus.attempted
        ? Math.round((totalsByStatus.delivered / totalsByStatus.attempted) * 100)
        : 0;
    const summaryStats = [
        { label: "Total Campaigns", value: String(totalsByStatus.total), sub: "all time" },
        { label: "Recipients", value: totalsByStatus.attempted.toLocaleString(), sub: "tracked messages" },
        {
            label: "Delivered",
            value: totalsByStatus.delivered.toLocaleString(),
            sub: `${avgDelivery}% delivery rate`,
        },
        { label: "In Progress", value: totalsByStatus.inProgress.toLocaleString(), sub: `${totalsByStatus.failed} failed` },
    ];

    const tableItems = campaigns;

    const sendCampaign = useMutation({
        mutationFn: (campaignId: number) => send_campaign(campaignId),
        onSettled: async () => {
            await queryClient.invalidateQueries({ queryKey: ["get-campaigns"] });
            await queryClient.invalidateQueries({ queryKey: ["campaign-status-counts"] });
            await queryClient.invalidateQueries({ queryKey: ["campaign-stats"] });
        },
    });

    const handleDeleteCampaign = useMutation({
        mutationFn: async (id: number) => {
            const result = await delete_campaign(id);
            if (!result.success) throw new Error(result.error ?? "Delete failed");
        },
        onSettled: async () => {
            await queryClient.invalidateQueries({ queryKey: ["get-campaigns"] });
            await queryClient.invalidateQueries({ queryKey: ["campaign-status-counts"] });
        },
    });

    function handleTabChange(value: string) {
        setTab(value as TabValue);
        setPage(1);
    }

    function handleSearchChange(event: React.ChangeEvent<HTMLInputElement>) {
        setSearch(event.target.value);
        setPage(1);
    }

    function handleSortChange(value: string) {
        setSort(value);
        setPage(1);
    }

    function handlePageSizeChange(value: string) {
        setPageSize(Number(value));
        setPage(1);
    }

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-4 rounded-lg border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                        Broadcasts
                    </p>
                    <h1 className="mt-1 text-3xl font-semibold tracking-tight">Campaigns</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Schedule, send, and measure outbound SMS campaigns.
                    </p>
                </div>
                <NewCampaignDialog
                    segments={(segments as SegmentItem[]) ?? []}
                    templates={(templatesData as TemplateItem_[]) ?? []}
                />
            </div>

            <div className="mt-6 space-y-5">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {summaryStats.map((s) => (
                        <Card key={s.label} className="py-4">
                            <CardHeader className="px-5 pb-1 pt-0">
                                <CardTitle className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                                    {s.label}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-5">
                                <p className="text-2xl font-semibold tabular-nums">{s.value}</p>
                                <p className="text-xs text-muted-foreground">{s.sub}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card className="gap-0 overflow-hidden py-0">
                    <div className="flex flex-col gap-3 border-b px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <Tabs value={tab} onValueChange={handleTabChange}>
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

                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search campaigns..."
                                    value={search}
                                    onChange={handleSearchChange}
                                    className="h-8 w-48 pl-8 text-xs"
                                />
                            </div>
                            <Select value={sort} onValueChange={handleSortChange}>
                                <SelectTrigger className="h-8 w-36 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="newest">Newest first</SelectItem>
                                    <SelectItem value="oldest">Oldest first</SelectItem>
                                    <SelectItem value="sent">Most sent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <CardContent className="p-0">
                        {tableItems.length === 0 ? (
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
                                        <TableHead className="text-xs font-semibold uppercase tracking-wide">
                                            Audience
                                        </TableHead>
                                        <TableHead className="text-xs font-semibold uppercase tracking-wide">
                                            Message
                                        </TableHead>
                                        <TableHead className="text-xs font-semibold uppercase tracking-wide">
                                            Recipients
                                        </TableHead>
                                        <TableHead className="text-xs font-semibold uppercase tracking-wide">
                                            Queued
                                        </TableHead>
                                        <TableHead className="text-xs font-semibold uppercase tracking-wide">
                                            Sent
                                        </TableHead>
                                        <TableHead className="text-xs font-semibold uppercase tracking-wide">
                                            Delivered
                                        </TableHead>
                                        <TableHead className="text-xs font-semibold uppercase tracking-wide">
                                            Failed
                                        </TableHead>
                                        <TableHead className="text-xs font-semibold uppercase tracking-wide">
                                            Status
                                        </TableHead>
                                        <TableHead className="text-xs font-semibold uppercase tracking-wide">
                                            Scheduled
                                        </TableHead>
                                        <TableHead className="text-xs font-semibold uppercase tracking-wide">
                                            Actions
                                        </TableHead>
                                        <TableHead />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tableItems.map((item: CampaignItem_) => {
                                        const s = statsMap[item.id];
                                        const total = s?.total ?? 0;
                                        const queued = s?.queued ?? 0;
                                        const sent = s?.sent ?? 0;
                                        const delivered = s?.delivered ?? 0;
                                        const failed = s?.failed ?? 0;
                                        const cfg = statusConfig[item.status ?? "Draft"];
                                        const isSending =
                                            sendCampaign.isPending && sendCampaign.variables === item.id;
                                        return (
                                            <TableRow key={item.id} className="group">
                                                <TableCell className="px-6">
                                                    <p className="font-medium">{item.campaign_name}</p>
                                                    <p className="text-[11px] text-muted-foreground">
                                                        Created {moment(item.created_at).format("MMM DD, YYYY")}
                                                    </p>
                                                </TableCell>
                                                <TableCell>
                                                    <CampaignAudienceCell segment={item.segments} workspaceId={workspaceId} />
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    <CampaignMessageCell campaign={item} />
                                                </TableCell>
                                                <TableCell className="tabular-nums text-muted-foreground">
                                                    {formatCount(total)}
                                                </TableCell>
                                                <TableCell className="tabular-nums text-muted-foreground">
                                                    {formatCount(queued)}
                                                </TableCell>
                                                <TableCell className="tabular-nums text-muted-foreground">
                                                    {formatCount(sent)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <span className="min-w-4 tabular-nums">
                                                            {formatCount(delivered)}
                                                        </span>
                                                        <DeliveryBar total={total} delivered={delivered} />
                                                    </div>
                                                </TableCell>
                                                <TableCell className="tabular-nums text-muted-foreground">
                                                    {formatCount(failed)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={cfg.variant} className="gap-1.5">
                                                        <span className={`size-1.5 rounded-full ${cfg.dot}`} />
                                                        {cfg.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {item.scheduled_date
                                                        ? moment(item.scheduled_date).format("MMM DD, YYYY h:mm A")
                                                        : "—"}
                                                </TableCell>
                                                <TableCell className="pr-4">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        disabled={
                                                            isSending ||
                                                            item.status === "Running" ||
                                                            item.status === "Completed"
                                                        }
                                                        onClick={() => sendCampaign.mutate(item.id)}
                                                    >
                                                        {isSending ? (
                                                            "Sending…"
                                                        ) : (
                                                            <>
                                                                <Send className="size-3.5 mr-1.5" />
                                                                Send Now
                                                            </>
                                                        )}
                                                    </Button>
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon-xs"
                                                                aria-label="Campaign actions"
                                                            >
                                                                <MoreHorizontal />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-44">
                                                            <DropdownMenuItem onSelect={() => setEditingCampaign(item)}>
                                                                Edit Campaign
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() => handleDeleteCampaign.mutate(item.id)}
                                                                className="text-destructive focus:text-destructive"
                                                            >
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
                    <div className="flex flex-col gap-3 border-t px-5 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                            <span>Rows per page</span>
                            <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                                <SelectTrigger className="h-8 w-20 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PAGE_SIZE_OPTIONS.map((value) => (
                                        <SelectItem key={value} value={String(value)}>
                                            {value}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="tabular-nums">
                                {isFetchingCampaigns ? "Updating..." : `Showing ${pageStart}-${pageEnd} of ${totalCampaigns}`}
                            </span>
                            <span className="tabular-nums">
                                Page {page} of {pageCount}
                            </span>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="icon-sm"
                                    aria-label="Previous page"
                                    disabled={page <= 1 || isFetchingCampaigns}
                                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                                >
                                    <ChevronLeft className="size-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon-sm"
                                    aria-label="Next page"
                                    disabled={page >= pageCount || isFetchingCampaigns}
                                    onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                                >
                                    <ChevronRight className="size-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {editingCampaign && (
                <EditCampaignDialog
                    campaign={editingCampaign}
                    segments={(segments as SegmentItem[]) ?? []}
                    templates={(templatesData as TemplateItem_[]) ?? []}
                    open={!!editingCampaign}
                    onOpenChange={(val) => {
                        if (!val) setEditingCampaign(null);
                    }}
                />
            )}
        </DashboardLayout>
    );
}
