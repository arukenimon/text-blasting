"use client";

import { useState, useMemo, useActionState, useEffect } from "react";
import { DashboardLayout } from "@/app/components/dashboard/dashboard-layout";
import { Topbar } from "@/app/components/dashboard/topbar";
import {
    templateItems,
    type TemplateItem,
    type TemplateCategory,
    type TemplateStatus,
    TemplateItem_,
} from "@/app/components/dashboard/dashboard-data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
    FileText,
    CheckCircle2,
    Clock,
    BarChart2,
    Plus,
    Search,
    MoreHorizontal,
    Copy,
    Pencil,
    Trash2,
    Eye,
    Send,
    LayoutGrid,
    List,
    Variable,
    Smartphone,
    XCircle,
} from "lucide-react";
import { add_template } from "./actions";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<TemplateCategory, string> = {
    Promotional: "bg-violet-50 text-violet-700 border-violet-200",
    Transactional: "bg-sky-50 text-sky-700 border-sky-200",
    "Re-engagement": "bg-amber-50 text-amber-700 border-amber-200",
    Welcome: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Alert: "bg-red-50 text-red-700 border-red-200",
};

const STATUS_CONFIG: Record<
    TemplateStatus,
    { label: string; classes: string; icon: React.ElementType }
> = {
    Approved: {
        label: "Approved",
        classes: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: CheckCircle2,
    },
    Pending: {
        label: "Pending",
        classes: "bg-amber-50 text-amber-700 border-amber-200",
        icon: Clock,
    },
    Rejected: {
        label: "Rejected",
        classes: "bg-red-50 text-red-700 border-red-200",
        icon: XCircle,
    },
};

const VARIABLE_SUGGESTIONS = [
    "{{full_name}}",
    // "{{last_name}}",
    // "{{brand_name}}",
    // "{{promo_code}}",
    // "{{discount}}",
    // "{{link}}",
    // "{{order_id}}",
    // "{{expiry_date}}",
    // "{{product_name}}",
    // "{{points}}",
];

const MAX_SMS_CHARS = 160;

/** Highlight {{variables}} in preview text */
function renderBodyPreview(body: string) {
    const parts = body.split(/({{[^}]+}})/g);
    return parts.map((part, i) =>
        /^{{.*}}$/.test(part) ? (
            <mark
                key={i}
                className="bg-violet-100 text-violet-700 rounded px-0.5 not-italic font-medium"
            >
                {part}
            </mark>
        ) : (
            <span key={i}>{part}</span>
        )
    );
}

// ─── Phone Preview ────────────────────────────────────────────────────────────
function PhonePreview({ body }: { body: string }) {
    return (
        <div className="flex flex-col items-center">
            <div className="relative w-[200px] bg-gray-900 rounded-[2rem] p-2.5 shadow-xl">
                {/* notch */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-3.5 bg-gray-800 rounded-full z-10" />
                <div className="bg-white rounded-[1.6rem] overflow-hidden">
                    {/* status bar */}
                    <div className="bg-gray-50 h-8 flex items-center justify-center">
                        <span className="text-[9px] text-muted-foreground tracking-wide mt-1">
                            SMS Preview
                        </span>
                    </div>
                    {/* message bubble */}
                    <div className="bg-gray-100 min-h-[160px] p-3 flex items-end">
                        <div className="bg-white rounded-2xl rounded-bl-sm shadow-sm p-2.5 max-w-full">
                            <p className="text-[10px] leading-relaxed text-gray-800 whitespace-pre-wrap break-words">
                                {body || "Your message will appear here…"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Template Preview Dialog ──────────────────────────────────────────────────
function PreviewDialog({ template }: { template: TemplateItem_ }) {
    const [open, setOpen] = useState(false);
    const StatusIcon = STATUS_CONFIG['Approved'].icon;
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <DropdownMenuItem
                    onSelect={(e) => {
                        e.preventDefault();
                        setOpen(true);
                    }}
                >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[680px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {template.template_name}
                        <Badge
                            variant="outline"
                            className={`text-[11px] font-medium ml-1 ${STATUS_CONFIG['Approved'].classes}`}
                        >
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {'Approved'}
                        </Badge>
                    </DialogTitle>
                    <DialogDescription>
                        <Badge
                            variant="outline"
                            className={`text-[11px] ${CATEGORY_COLORS[template.category]}`}
                        >
                            {template.category}
                        </Badge>
                        <span className="ml-2 text-xs text-muted-foreground">
                            Created {template.created_at} · Used in -- campaign
                            {/* {template.usedIn !== 1 ? "s" : ""} */}
                        </span>
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-[1fr_auto] gap-6 py-2">
                    <div className="space-y-4">
                        {/* Body */}
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                Message Body
                            </p>
                            <div className="rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed">
                                {renderBodyPreview(template.body)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1.5">
                                {template.body.length} chars ·{" "}
                                {Math.ceil(template.body.length / MAX_SMS_CHARS)} SMS segment
                                {Math.ceil(template.body.length / MAX_SMS_CHARS) !== 1
                                    ? "s"
                                    : ""}
                            </p>
                        </div>
                        {/* Variables */}
                        {/* {template.variables.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                                    <Variable className="h-3.5 w-3.5" /> Variables
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {template.variables.map((v) => (
                                        <Badge
                                            key={v}
                                            variant="secondary"
                                            className="font-mono text-[11px]"
                                        >
                                            {v}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )} */}
                    </div>
                    {/* Phone preview */}
                    <div className="hidden sm:block">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1">
                            <Smartphone className="h-3.5 w-3.5" /> Device Preview
                        </p>
                        <PhonePreview body={template.body} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Close
                    </Button>
                    <Button>
                        <Send className="h-4 w-4 mr-1.5" />
                        Use in Campaign
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── New / Edit Template Dialog ───────────────────────────────────────────────
function TemplateFormDialog({
    trigger,
    initial,
}: {
    trigger: React.ReactNode;
    initial?: Partial<TemplateItem>;
}) {
    const [open, setOpen] = useState(false);
    const [body, setBody] = useState(initial?.body ?? "");
    const isEdit = !!initial?.id;

    function insertVar(v: string) {
        setBody((prev) => prev + v);
    }

    const charCount = body.length;
    const segments = Math.max(1, Math.ceil(charCount / MAX_SMS_CHARS));
    const remaining = segments * MAX_SMS_CHARS - charCount;

    const [state, action, pending] = useActionState(add_template, undefined);

    useEffect(() => {
        if (state?.success) {
            setOpen(false);
        }
    }, [state]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="sm:max-w-[780px] max-h-[90vh] overflow-y-auto">

                <form action={action}>
                    <DialogHeader>
                        <DialogTitle>
                            {isEdit ? "Edit Template" : "New Template"}
                        </DialogTitle>
                        <DialogDescription>
                            {isEdit
                                ? "Update your message template. Changes apply to future campaigns only."
                                : "Create a reusable SMS template. Use {{variables}} for dynamic content."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-6 py-2">
                        {/* Left: form */}
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-1.5">
                                    <label className="text-sm font-medium">Template Name</label>
                                    <Input
                                        placeholder="e.g. Summer Promo"
                                        defaultValue={initial?.name}
                                        name="template_name"
                                    />
                                    {state?.errors.template_name && (
                                        <span className="text-red-500 text-sm">
                                            {state.errors.template_name.join(', ')}
                                        </span>
                                    )}
                                </div>
                                <div className="grid gap-1.5">
                                    <label className="text-sm font-medium">Category</label>
                                    <Select defaultValue={initial?.category} name="category">
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category…" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(
                                                [
                                                    "Promotional",
                                                    "Transactional",
                                                    "Re-engagement",
                                                    "Welcome",
                                                    "Alert",
                                                ] as TemplateCategory[]
                                            ).map((c) => (
                                                <SelectItem key={c} value={c}>
                                                    {c}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {state?.errors.category && (
                                        <span className="text-red-500 text-sm">
                                            {state.errors.category.join(', ')}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Body */}
                            <div className="grid gap-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium">Message Body</label>
                                    <span
                                        className={`text-xs tabular-nums ${remaining < 20
                                            ? "text-red-500"
                                            : "text-muted-foreground"
                                            }`}
                                    >
                                        {charCount} / {segments * MAX_SMS_CHARS} · {segments} segment
                                        {segments !== 1 ? "s" : ""}
                                    </span>
                                </div>
                                <Textarea
                                    placeholder="Type your message… Use {{variable}} for personalization."
                                    className="min-h-[130px] resize-none font-mono text-sm"
                                    value={body}
                                    name="template_body"
                                    onChange={(e) => setBody(e.target.value)}
                                />
                                {state?.errors.template_body && (
                                    <span className="text-red-500 text-sm">
                                        {state.errors.template_body.join(', ')}
                                    </span>
                                )}
                                {/* Progress bar */}
                                <div className="w-full h-1 rounded-full bg-muted overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all ${remaining < 20
                                            ? "bg-red-500"
                                            : remaining < 50
                                                ? "bg-amber-400"
                                                : "bg-emerald-500"
                                            }`}
                                        style={{
                                            width: `${Math.min(
                                                100,
                                                (charCount / (segments * MAX_SMS_CHARS)) * 100
                                            )}%`,
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Variable inserter */}
                            <div className="grid gap-1.5">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                                    <Variable className="h-3.5 w-3.5" /> Insert Variable
                                </label>
                                <div className="flex flex-wrap gap-1.5">
                                    {VARIABLE_SUGGESTIONS.map((v) => (
                                        <button
                                            key={v}
                                            type="button"
                                            onClick={() => insertVar(v)}
                                            className="font-mono text-[11px] px-2 py-1 rounded-md bg-muted hover:bg-violet-100 hover:text-violet-700 border border-border transition-colors"
                                        >
                                            {v}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <Separator />

                            {/* Opt-out reminder */}
                            <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                                <span className="mt-0.5">⚠️</span>
                                Always include an opt-out phrase (e.g.{" "}
                                <code className="font-mono bg-muted px-1 rounded">
                                    Reply STOP to opt out
                                </code>
                                ) to stay compliant with TCPA / CTIA guidelines.
                            </p>
                        </div>

                        {/* Right: phone preview */}
                        <div className="hidden md:flex flex-col items-center gap-2 pt-7">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                                <Smartphone className="h-3.5 w-3.5" /> Preview
                            </p>
                            <PhonePreview body={body} />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {isEdit ? "Save Changes" : "Create Template"}
                        </Button>
                    </DialogFooter>

                </form>

            </DialogContent>
        </Dialog>
    );
}

// ─── Template Card (grid view) ────────────────────────────────────────────────
function TemplateCard({ item }: { item: TemplateItem_ }) {
    const StatusIcon = STATUS_CONFIG['Approved'].icon;
    return (
        <Card className="group flex flex-col hover:shadow-md transition-shadow">
            <CardContent className="flex flex-col gap-3 p-5 flex-1">
                {/* Top row */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{item.template_name}</p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <Badge
                                variant="outline"
                                className={`text-[10px] font-medium ${CATEGORY_COLORS[item.category]}`}
                            >
                                {item.category}
                            </Badge>
                            {/* <Badge
                                variant="outline"
                                className={`text-[10px] font-medium ${STATUS_CONFIG[item.status].classes}`}
                            >
                                <StatusIcon className="h-2.5 w-2.5 mr-0.5" />
                                {item.status}
                            </Badge> */}
                        </div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <PreviewDialog template={item} />
                            <TemplateFormDialog
                                initial={item}
                                trigger={
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        <Pencil className="h-4 w-4 mr-2" />
                                        Edit
                                    </DropdownMenuItem>
                                }
                            />
                            <DropdownMenuItem>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Send className="h-4 w-4 mr-2" />
                                Use in Campaign
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Body preview */}
                <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed flex-1">
                    {item.body}
                </p>

                {/* Variables */}
                {/* {item?.variables?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {item.variables.slice(0, 4).map((v) => (
                            <Badge
                                key={v}
                                variant="secondary"
                                className="font-mono text-[9px] px-1.5 py-0"
                            >
                                {v}
                            </Badge>
                        ))}
                        {item.variables.length > 4 && (
                            <Badge
                                variant="secondary"
                                className="text-[9px] px-1.5 py-0 text-muted-foreground"
                            >
                                +{item.variables.length - 4}
                            </Badge>
                        )}
                    </div>
                )} */}

                {/* Footer */}
                <Separator className="mt-auto" />
                {/* <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>
                        {item.body.length} chars ·{" "}
                        {Math.ceil(item.body.length / MAX_SMS_CHARS)} seg
                    </span>
                    <span>
                        Used in{" "}
                        <span className="font-medium text-foreground">
                            {item.usedIn}
                        </span>{" "}
                        campaign{item.usedIn !== 1 ? "s" : ""}
                    </span>
                </div> */}
            </CardContent>
        </Card>
    );
}

// ─── Template Row (list view) ─────────────────────────────────────────────────
function TemplateRow({ item }: { item: TemplateItem_ }) {
    const StatusIcon = STATUS_CONFIG['Approved'].icon;
    return (
        <div className="group grid grid-cols-[1fr_130px_110px_90px_90px_40px] items-center gap-4 px-5 py-3.5 border-b last:border-0 hover:bg-muted/40 transition-colors text-sm">
            <div className="min-w-0">
                <p className="font-medium truncate">{item.template_name}</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{item.body}</p>
            </div>
            <Badge
                variant="outline"
                className={`text-[10px] w-fit font-medium ${CATEGORY_COLORS[item.category]}`}
            >
                {item.category}
            </Badge>
            <Badge
                variant="outline"
                className={`text-[10px] w-fit font-medium ${STATUS_CONFIG['Approved'].classes}`}
            >
                <StatusIcon className="h-2.5 w-2.5 mr-0.5" />
                {'Approved'}
            </Badge>
            <span className="text-xs text-muted-foreground">Yesterday</span>
            <span className="text-xs text-muted-foreground">
                {/* {item.usedIn} campaign{item.usedIn !== 1 ? "s" : ""} */}
            </span>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
                    >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <PreviewDialog template={item} />
                    <TemplateFormDialog
                        initial={item}
                        trigger={
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                            </DropdownMenuItem>
                        }
                    />
                    <DropdownMenuItem>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <Send className="h-4 w-4 mr-2" />
                        Use in Campaign
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TemplatesPage() {
    const [categoryFilter, setCategoryFilter] = useState<"all" | TemplateCategory>("all");
    const [statusFilter, setStatusFilter] = useState<"all" | TemplateStatus>("all");
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("name");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    const filtered = useMemo(() => {
        let list = [...templateItems];

        if (categoryFilter !== "all") {
            list = list.filter((t) => t.category === categoryFilter);
        }
        if (statusFilter !== "all") {
            list = list.filter((t) => t.status === statusFilter);
        }
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter(
                (t) =>
                    t.name.toLowerCase().includes(q) ||
                    t.body.toLowerCase().includes(q) ||
                    t.category.toLowerCase().includes(q)
            );
        }

        list.sort((a, b) => {
            if (sortBy === "name") return a.name.localeCompare(b.name);
            if (sortBy === "newest") return b.createdAt.localeCompare(a.createdAt);
            if (sortBy === "usage") return b.usedIn - a.usedIn;
            if (sortBy === "length") return b.body.length - a.body.length;
            return 0;
        });

        return list;
    }, [categoryFilter, statusFilter, search, sortBy]);

    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = { all: templateItems.length };
        for (const t of templateItems) {
            counts[t.category] = (counts[t.category] ?? 0) + 1;
        }
        return counts;
    }, []);

    const stats = [
        {
            label: "Total Templates",
            value: templateItems.length.toString(),
            sub: "Across all categories",
            icon: FileText,
            color: "text-blue-500",
            accent: "border-l-blue-500",
        },
        {
            label: "Approved",
            value: templateItems.filter((t) => t.status === "Approved").length.toString(),
            sub: "Ready to send",
            icon: CheckCircle2,
            color: "text-emerald-500",
            accent: "border-l-emerald-500",
        },
        {
            label: "Pending Review",
            value: templateItems.filter((t) => t.status === "Pending").length.toString(),
            sub: "Awaiting approval",
            icon: Clock,
            color: "text-amber-500",
            accent: "border-l-amber-500",
        },
        {
            label: "Campaigns Using",
            value: templateItems.reduce((acc, t) => acc + t.usedIn, 0).toString(),
            sub: "Total campaign references",
            icon: BarChart2,
            color: "text-violet-500",
            accent: "border-l-violet-500",
        },
    ];

    const categories: TemplateCategory[] = [
        "Promotional",
        "Transactional",
        "Re-engagement",
        "Welcome",
        "Alert",
    ];

    const { data } = useQuery({
        queryKey: ["templates"],
        queryFn: async () => {
            const { data, error } = await supabase.from('templates')
                .select('*');
            if (error) {
                throw new Error(error.message);
            }
            return data;
        }
    })

    useEffect(() => console.log("Fetched templates:", data), [data]);

    return (
        <DashboardLayout>
            <div className="flex flex-col flex-1 min-w-0">
                <Topbar />
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* ── Header ─────────────────────────────────── */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Templates</h1>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                Manage reusable SMS templates for your campaigns.
                            </p>
                        </div>
                        <TemplateFormDialog
                            trigger={
                                <Button size="sm">
                                    <Plus className="h-4 w-4 mr-1.5" />
                                    New Template
                                </Button>
                            }
                        />
                    </div>

                    {/* ── Stat cards ─────────────────────────────── */}
                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                        {stats.map((s) => {
                            const Icon = s.icon;
                            return (
                                <Card key={s.label} className={`border-l-4 ${s.accent}`}>
                                    <CardContent className="pt-4 pb-4">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                                {s.label}
                                            </span>
                                            <Icon className={`h-4 w-4 ${s.color}`} />
                                        </div>
                                        <p className="text-2xl font-bold">{s.value}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {/* ── Filters + View toggle ───────────────────── */}
                    <Card>
                        <CardContent className="p-4 space-y-3">
                            {/* Category tabs */}
                            <Tabs
                                value={categoryFilter}
                                onValueChange={(v) =>
                                    setCategoryFilter(v as "all" | TemplateCategory)
                                }
                            >
                                <TabsList className="h-8 flex-wrap">
                                    <TabsTrigger value="all" className="text-xs px-3">
                                        All{" "}
                                        <span className="ml-1 text-muted-foreground">
                                            {categoryCounts.all}
                                        </span>
                                    </TabsTrigger>
                                    {categories.map((c) => (
                                        <TabsTrigger key={c} value={c} className="text-xs px-3">
                                            {c}{" "}
                                            <span className="ml-1 text-muted-foreground">
                                                {categoryCounts[c] ?? 0}
                                            </span>
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </Tabs>

                            {/* Search / sort / status / view */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <div className="relative flex-1 min-w-[180px]">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                    <Input
                                        placeholder="Search templates…"
                                        className="pl-8 h-8 text-sm"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "all" | TemplateStatus)}>
                                    <SelectTrigger className="w-[150px] h-8 text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value="Approved">Approved</SelectItem>
                                        <SelectItem value="Pending">Pending</SelectItem>
                                        <SelectItem value="Rejected">Rejected</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={sortBy} onValueChange={setSortBy}>
                                    <SelectTrigger className="w-[170px] h-8 text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="name">Sort: Name A–Z</SelectItem>
                                        <SelectItem value="newest">Sort: Newest First</SelectItem>
                                        <SelectItem value="usage">Sort: Most Used</SelectItem>
                                        <SelectItem value="length">Sort: Longest First</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="flex border rounded-md overflow-hidden">
                                    <Button
                                        variant={viewMode === "grid" ? "default" : "ghost"}
                                        size="icon"
                                        className="h-8 w-8 rounded-none"
                                        onClick={() => setViewMode("grid")}
                                    >
                                        <LayoutGrid className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        variant={viewMode === "list" ? "default" : "ghost"}
                                        size="icon"
                                        className="h-8 w-8 rounded-none border-l"
                                        onClick={() => setViewMode("list")}
                                    >
                                        <List className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ── Results ────────────────────────────────── */}
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
                            <p className="text-sm font-medium text-muted-foreground">
                                No templates found
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Try adjusting your filters or{" "}
                                <TemplateFormDialog
                                    trigger={
                                        <button className="underline underline-offset-2 hover:text-foreground transition-colors">
                                            create a new template
                                        </button>
                                    }
                                />
                                .
                            </p>
                        </div>
                    ) : viewMode === "grid" ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                            {data?.map((t) => (
                                <TemplateCard key={t.id} item={t} />
                            ))}
                        </div>
                    ) : (
                        <Card className="overflow-hidden">
                            {/* List header */}
                            <div className="grid grid-cols-[1fr_130px_110px_90px_90px_40px] gap-4 px-5 py-2.5 bg-muted/50 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                <span>Template</span>
                                <span>Category</span>
                                <span>Status</span>
                                <span>Last Used</span>
                                <span>Campaigns</span>
                                <span />
                            </div>
                            {data?.map((t) => (
                                <TemplateRow key={t.id} item={t} />
                            ))}
                        </Card>
                    )}

                    {/* Footer count */}
                    {data && data?.length > 0 && (
                        <p className="text-xs text-muted-foreground pb-2">
                            Showing {data.length} of {templateItems.length} templates
                        </p>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
