"use client";

import { useState, useMemo, useActionState, useEffect } from "react";
import { DashboardLayout } from "@/app/components/dashboard/dashboard-layout";
import { Topbar } from "@/app/components/dashboard/topbar";
import {
    segmentItems,
    type SegmentItem,
    type ContactStatus,
    type ContactItem,
} from "@/app/components/dashboard/dashboard-data";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
import {
    Users,
    UserCheck,
    UserX,
    Layers,
    Search,
    Upload,
    Plus,
    MoreHorizontal,
    TrendingUp,
    TrendingDown,
    Trash2,
    Send,
    Tag,
    UserMinus,
    UserPlus,
    ChevronRight,
} from "lucide-react";
import { add_contact, add_segment } from "./actions";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { getSegmentsOption } from "./QueryOptions";

// ─── Stat card data derived from contacts ────────────────────────────────────
// function buildStats() {
//     const total = contactItems.length;
//     // const subscribed = contactItems.filter((c) => c.status === "Subscribed").length;
//     // const optedOut = contactItems.filter((c) => c.status === "Opted Out").length;
//     const segments = segmentItems.length;
//     return [
//         {
//             label: "Total Contacts",
//             value: total.toLocaleString(),
//             sub: `Across ${segments} segments`,
//             icon: Users,
//             color: "text-blue-500",
//             accent: "border-l-blue-500",
//         },
//         {
//             label: "Subscribed",
//             value: subscribed.toLocaleString(),
//             sub: `${Math.round((subscribed / total) * 100)}% opt-in rate`,
//             icon: UserCheck,
//             color: "text-emerald-500",
//             accent: "border-l-emerald-500",
//         },
//         {
//             label: "Opted Out",
//             value: optedOut.toLocaleString(),
//             sub: `${Math.round((optedOut / total) * 100)}% of total`,
//             icon: UserX,
//             color: "text-red-500",
//             accent: "border-l-red-500",
//         },
//         {
//             label: "Active Segments",
//             value: segments.toLocaleString(),
//             sub: "Custom audience groups",
//             icon: Layers,
//             color: "text-violet-500",
//             accent: "border-l-violet-500",
//         },
//     ];
// }

// ─── Status badge helper ──────────────────────────────────────────────────────
function StatusBadge({ status }: { status: ContactStatus }) {
    const map: Record<ContactStatus, string> = {
        Subscribed: "bg-emerald-50 text-emerald-700 border-emerald-200",
        "Opted Out": "bg-red-50 text-red-700 border-red-200",
        Undeliverable: "bg-amber-50 text-amber-700 border-amber-200",
    };
    return (
        <Badge
            variant="outline"
            className={`text-[11px] font-medium ${map[status]}`}
        >
            {status}
        </Badge>
    );
}

// ─── Segment sidebar card ─────────────────────────────────────────────────────
function SegmentCard({
    seg,
    active,
    onClick,
}: {
    seg: SegmentItem;
    active: boolean;
    onClick: () => void;
}) {
    // const isPositive = seg?.growth?.startsWith("+");
    return (
        <button
            onClick={onClick}
            className={`w-full text-left rounded-lg border p-3 transition-all hover:shadow-sm ${active
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border bg-card hover:bg-muted/40"
                }`}
        >
            <div className="flex items-center gap-2 mb-1.5">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0`} style={{ backgroundColor: seg.color_hex }} />
                <span className="font-medium text-sm truncate">{seg.name}</span>
                <ChevronRight className={`ml-auto h-3.5 w-3.5 text-muted-foreground transition-opacity ${active ? "opacity-100" : "opacity-0"}`} />
            </div>
            <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                    {seg?.contacts?.[0]?.count ?? 0} contacts
                </span>
                {/* <span
                    className={`flex items-center gap-0.5 text-[11px] font-medium ${isPositive ? "text-emerald-600" : "text-red-500"
                        }`}
                >
                    {isPositive ? (
                        <TrendingUp className="h-3 w-3" />
                    ) : (
                        <TrendingDown className="h-3 w-3" />
                    )}
                    {seg.growth.replace(/ this week/, "")}
                </span> */}
            </div>
        </button>
    );
}

// ─── New Segment Dialog ───────────────────────────────────────────────────────
function NewSegmentDialog() {
    const [open, setOpen] = useState(false);
    const [color, setColor] = useState("#6366f1");

    const [segmentState, addSegmentAction, segmentPending] = useActionState(add_segment, undefined);

    // Close dialog and update local list on success
    useEffect(() => {
        if (segmentState?.success) {
            setOpen(false);
        }
    }, [segmentState]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <Plus className="h-4 w-4 mr-1.5" />
                    New Segment
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[440px]">
                <form action={addSegmentAction}>
                    <DialogHeader>
                        <DialogTitle>Create Segment</DialogTitle>
                        <DialogDescription>
                            Define a new audience group. You can filter contacts after creation.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-2">
                        <div className="grid gap-1.5">
                            <label className="text-sm font-medium">Segment Name</label>
                            <Input placeholder="e.g. High-value Prospects" name="name" />
                            {segmentState?.errors?.name && (
                                <p className="text-xs text-red-500">{segmentState.errors.name[0]}</p>
                            )}
                        </div>
                        <div className="grid gap-1.5">
                            <label className="text-sm font-medium">Description</label>
                            <Input placeholder="Brief description of this segment" name="description" />
                            {segmentState?.errors?.description && (
                                <p className="text-xs text-red-500">{segmentState.errors.description[0]}</p>
                            )}
                        </div>
                        {/* <div className="grid gap-1.5">
                        <label className="text-sm font-medium">Base Segment (optional)</label>
                        <Select>
                            <SelectTrigger>
                                <SelectValue placeholder="Clone from existing segment…" />
                            </SelectTrigger>
                            <SelectContent>
                                {segmentItems.map((s) => (
                                    <SelectItem key={s.id} value={s.id}>
                                        {s.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div> */}
                        <div className="grid gap-1.5">
                            <label className="text-sm font-medium">Color Label</label>
                            <div className="flex items-center gap-3">
                                <label className="relative cursor-pointer">
                                    <span
                                        className="block w-8 h-8 rounded-full border-2 border-border shadow-sm"
                                        style={{ backgroundColor: color }}
                                    />
                                    <input
                                        type="color"
                                        value={color}
                                        onChange={(e) => setColor(e.target.value)}
                                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                    />
                                </label>
                                <input
                                    type="text"
                                    value={color}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setColor(v);
                                    }}
                                    className="h-8 w-28 rounded-md border border-input bg-background px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                                    maxLength={7}
                                    spellCheck={false}
                                />
                                <input type="hidden" name="color" value={color} />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">Create Segment</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ─── Import Contacts Dialog ───────────────────────────────────────────────────
function ImportDialog() {
    const [open, setOpen] = useState(false);
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-1.5" />
                    Import
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[440px]">
                <DialogHeader>
                    <DialogTitle>Import Contacts</DialogTitle>
                    <DialogDescription>
                        Upload a CSV file with columns: Name, Phone, Segment, Tags.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-lg cursor-pointer bg-muted/40 hover:bg-muted/70 transition-colors">
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-sm font-medium">Click to upload CSV</span>
                        <span className="text-xs text-muted-foreground mt-1">Max 50 MB · UTF-8 encoded</span>
                        <input type="file" accept=".csv" className="hidden" />
                    </label>
                    <p className="text-xs text-muted-foreground mt-3">
                        Existing contacts matched by phone number will be updated. New
                        numbers will be appended.
                    </p>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={() => setOpen(false)}>Start Import</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Add Contact Dialog ──────────────────────────────────────────────────────
function AddContactDialog({ onAdd, segments }: { onAdd: (c: ContactItem) => void, segments: SegmentItem[] }) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [segment, setSegment] = useState("");

    const [state, action, pending] = useActionState(add_contact, undefined);



    // Close dialog and update local list on success
    useEffect(() => {
        if (state?.success) {
            // onAdd({
            //     id: `u${Date.now()}`,
            //     name: name.trim(),
            //     phone: phone.trim(),
            //     status: "Subscribed",
            //     lastMessaged: "—",
            //     joinedAt: "Mar 4, 2026",
            //     tags: [],
            // });
            setName("");
            setPhone("");
            setSegment("");
            setOpen(false);
        }
    }, [state]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                    <UserPlus className="h-4 w-4 mr-1.5" />
                    Add Contact
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[440px]">
                <DialogHeader>
                    <DialogTitle>Add Contact</DialogTitle>
                    <DialogDescription>
                        Manually add a single contact and assign them to a segment.
                    </DialogDescription>
                </DialogHeader>
                <form action={action}>
                    <div className="grid gap-4 py-2">
                        <div className="grid gap-1.5">
                            <label className="text-sm font-medium">Full Name {`{{full_name}}`}</label>
                            <Input
                                placeholder="e.g. Jane Smith"
                                name="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                            {state?.errors?.name && (
                                <p className="text-xs text-red-500">{state.errors.name[0]}</p>
                            )}
                        </div>
                        <div className="grid gap-1.5">
                            <label className="text-sm font-medium">Phone Number {`{{phone_no}}`}</label>
                            <Input
                                placeholder="e.g. 15550000000"
                                name="phone_no"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                            {state?.errors?.phone_no && (
                                <p className="text-xs text-red-500">{state.errors.phone_no[0]}</p>
                            )}
                        </div>
                        <div className="grid gap-1.5">
                            <label className="text-sm font-medium">Segment</label>
                            <Select name="segment" value={segment} onValueChange={setSegment}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Assign to a segment…" />
                                </SelectTrigger>
                                <SelectContent>
                                    {segments?.map((s) => (
                                        <SelectItem key={s.id} value={s.id}>
                                            {s.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {state?.errors?.segment && (
                                <p className="text-xs text-red-500">{state.errors.segment[0]}</p>
                            )}
                        </div>
                    </div>
                    <DialogFooter className="pt-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={pending || !name.trim() || !phone.trim() || !segment}
                        >
                            {pending ? "Adding…" : "Add Contact"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ─── Move to Segment Dialog ───────────────────────────────────────────────────
function MoveToSegmentDialog({
    open,
    onOpenChange,
    count,
    onMove,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    count: number;
    onMove: (segmentName: string) => void;
}) {
    const [target, setTarget] = useState("");

    function handleMove() {
        if (!target) return;
        onMove(target);
        setTarget("");
    }




    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) setTarget(""); onOpenChange(o); }}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Move to Segment</DialogTitle>
                    <DialogDescription>
                        Reassign {count} contact{count !== 1 ? "s" : ""} to a different segment.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-2">
                    <Select value={target} onValueChange={setTarget}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select target segment…" />
                        </SelectTrigger>
                        <SelectContent>
                            {segmentItems.map((s) => (
                                <SelectItem key={s.id} value={s.name}>
                                    <span className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full`} style={{ backgroundColor: s.color_hex }} />
                                        {s.name}
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleMove} disabled={!target}>
                        Move
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AudiencePage() {

    // const [contacts, setContacts] = useState([...contactItems]);
    const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<"all" | ContactStatus>("all");
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("name");
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [moveDialogIds, setMoveDialogIds] = useState<string[] | null>(null);






    function toggleOne(id: string) {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }


    const { data: segments } = useQuery(
        getSegmentsOption()
        //     {
        //     queryKey: ["get-segments"],
        //     queryFn: async () => {
        //         const { data, error } = await supabase.from('segments')
        //             .select('*, contacts(count)'); // Get segments with count of related contacts
        //         if (error) throw new Error(error.message);
        //         return data;
        //     }
        // }
    )


    const { data: contacts_ } = useInfiniteQuery({
        queryKey: ["get-contacts"],
        queryFn: async () => {
            const { data, error } = await supabase.from('contacts')
                .select('*,segments(name)'); // Get contacts with related segments
            if (error) throw new Error(error.message);
            return data;
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            if (lastPage.length === 20) return allPages.length; // Assuming page size of 20
            return undefined;
        }
    })

    const contactsFlattened = useMemo(() => contacts_ ? contacts_.pages.flat() : [], [contacts_]);

    return (
        <DashboardLayout>
            <div className="flex flex-col flex-1 min-w-0">
                <Topbar />
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* ── Page header ────────────────────────────── */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Audience</h1>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                Manage contacts and segments across your subscriber base.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <ImportDialog />
                            <AddContactDialog segments={segments as SegmentItem[]} onAdd={(c) => { }} />
                            <NewSegmentDialog />
                        </div>
                    </div>

                    {/* ── Stat cards ─────────────────────────────── */}
                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                        {/* {stats.map((s) => {
                            const Icon = s.icon;
                            return (
                                <Card
                                    key={s.label}
                                    className={`border-l-4 ${s.accent}`}
                                >
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
                        })} */}
                    </div>

                    {/* ── Two-column layout ──────────────────────── */}
                    <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-6 items-start">

                        {/* Left — segment list */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-semibold">Segments</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs text-muted-foreground"
                                    onClick={() => setActiveSegmentId(null)}
                                    disabled={!activeSegmentId}
                                >
                                    Clear filter
                                </Button>
                            </div>
                            {segments?.map((seg) => (
                                <SegmentCard
                                    key={seg.id}
                                    seg={seg}
                                    active={activeSegmentId === seg.id}
                                    onClick={() =>
                                        setActiveSegmentId((prev) =>
                                            prev === seg.id ? null : seg.id
                                        )
                                    }
                                />
                            ))}
                            <div className="pt-1">
                                <NewSegmentDialog />
                            </div>
                        </div>

                        {/* Right — contacts table */}
                        <Card className="min-w-0">
                            <CardHeader className="pb-3 pt-4 px-5 border-b">
                                <div className="flex flex-col gap-3">

                                    {/* Bulk action bar */}
                                    {selected.size > 0 && (
                                        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-primary/8 border border-primary/20 text-sm">
                                            <span className="font-medium text-primary">
                                                {selected.size} selected
                                            </span>
                                            <div className="flex items-center gap-1.5 ml-auto">
                                                <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                                                    <Send className="h-3 w-3" /> Send Campaign
                                                </Button>
                                                <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                                                    <Tag className="h-3 w-3" /> Add Tag
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-7 text-xs gap-1"
                                                    onClick={() => setMoveDialogIds([...selected])}
                                                >
                                                    <Layers className="h-3 w-3" /> Move to Segment
                                                </Button>
                                                <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-amber-600 border-amber-200 hover:bg-amber-50">
                                                    <UserMinus className="h-3 w-3" /> Opt Out
                                                </Button>
                                                <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-red-600 border-red-200 hover:bg-red-50">
                                                    <Trash2 className="h-3 w-3" /> Delete
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Filters row */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <div className="relative flex-1 min-w-[180px]">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                            <Input
                                                placeholder="Search by name or phone…"
                                                className="pl-8 h-8 text-sm"
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                            />
                                        </div>
                                        <Select value={sortBy} onValueChange={setSortBy}>
                                            <SelectTrigger className="w-[160px] h-8 text-sm">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="name">Sort: Name A–Z</SelectItem>
                                                <SelectItem value="joined">Sort: Newest Joined</SelectItem>
                                                <SelectItem value="messaged">Sort: Last Messaged</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Status tabs */}
                                    {/* <Tabs
                                        value={statusFilter}
                                        onValueChange={(v) =>
                                            setStatusFilter(v as "all" | ContactStatus)
                                        }
                                    >
                                        <TabsList className="h-8">
                                            <TabsTrigger value="all" className="text-xs px-3">
                                                All <span className="ml-1 text-muted-foreground">{statusCounts.all}</span>
                                            </TabsTrigger>
                                            <TabsTrigger value="Subscribed" className="text-xs px-3">
                                                Subscribed <span className="ml-1 text-muted-foreground">{statusCounts.Subscribed}</span>
                                            </TabsTrigger>
                                            <TabsTrigger value="Opted Out" className="text-xs px-3">
                                                Opted Out <span className="ml-1 text-muted-foreground">{statusCounts["Opted Out"]}</span>
                                            </TabsTrigger>
                                            <TabsTrigger value="Undeliverable" className="text-xs px-3">
                                                Undeliverable <span className="ml-1 text-muted-foreground">{statusCounts.Undeliverable}</span>
                                            </TabsTrigger>
                                        </TabsList>
                                    </Tabs> */}
                                </div>
                            </CardHeader>

                            <CardContent className="p-0">
                                {contactsFlattened.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-center">
                                        <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
                                        <p className="text-sm font-medium text-muted-foreground">No contacts found</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Try adjusting your filters or search query.
                                        </p>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="hover:bg-transparent">
                                                <TableHead className="w-10 pl-5">
                                                    {/* <Checkbox
                                                        checked={allSelected}
                                                        onCheckedChange={toggleAll}
                                                        aria-label="Select all"
                                                    /> */}
                                                </TableHead>
                                                <TableHead>Name / Phone</TableHead>
                                                <TableHead>Segment</TableHead>
                                                {/* <TableHead>Status</TableHead> */}
                                                <TableHead className="hidden lg:table-cell">Last Messaged</TableHead>
                                                {/* <TableHead className="hidden lg:table-cell">Joined</TableHead> */}
                                                {/* <TableHead className="hidden xl:table-cell">Tags</TableHead> */}
                                                <TableHead className="w-10" />
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {contactsFlattened.map((contact) => {
                                                const segColor =
                                                    segmentItems.find(
                                                        (s) => s.id === contact.segment_id
                                                    )?.color_hex ?? "#d1d5db";
                                                return (
                                                    <TableRow
                                                        key={contact.id}
                                                        className={
                                                            selected.has(contact.id)
                                                                ? "bg-primary/5"
                                                                : undefined
                                                        }
                                                    >
                                                        <TableCell className="pl-5">
                                                            <Checkbox
                                                                checked={selected.has(contact.id)}
                                                                onCheckedChange={() => toggleOne(contact.id)}
                                                                aria-label={`Select ${contact.name}`}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="font-medium text-sm">{contact.full_name}</div>
                                                            <div className="text-xs text-muted-foreground">{contact.phone_no}</div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className="flex items-center gap-1.5 text-sm">
                                                                <span className={`w-2 h-2 rounded-full shrink-0 ${segColor}`} />
                                                                {contact.segments.name || "—"}
                                                            </span>
                                                        </TableCell>
                                                        {/* <TableCell>
                                                            <StatusBadge status={contact.status} />
                                                        </TableCell> */}
                                                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                                                            {contact.lastMessaged}
                                                        </TableCell>
                                                        {/* <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                                                            {contact.joinedAt}
                                                        </TableCell> */}
                                                        {/* <TableCell className="hidden xl:table-cell">
                                                            <div className="flex flex-wrap gap-1">
                                                                {contact.tags.length === 0 ? (
                                                                    <span className="text-xs text-muted-foreground/50">—</span>
                                                                ) : (
                                                                    contact.tags.map((tag) => (
                                                                        <Badge
                                                                            key={tag}
                                                                            variant="secondary"
                                                                            className="text-[10px] px-1.5 py-0"
                                                                        >
                                                                            {tag}
                                                                        </Badge>
                                                                    ))
                                                                )}
                                                            </div>
                                                        </TableCell> */}
                                                        <TableCell>
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
                                                                    <DropdownMenuItem>
                                                                        <Users className="h-4 w-4 mr-2" />
                                                                        View Profile
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem>
                                                                        <Send className="h-4 w-4 mr-2" />
                                                                        Send Message
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem>
                                                                        <Tag className="h-4 w-4 mr-2" />
                                                                        Add Tag
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => setMoveDialogIds([contact.id])}
                                                                    >
                                                                        <Layers className="h-4 w-4 mr-2" />
                                                                        Move to Segment
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem className="text-amber-600">
                                                                        <UserMinus className="h-4 w-4 mr-2" />
                                                                        Opt Out
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem className="text-red-600">
                                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                                        Delete Contact
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

                            {/* Footer row count */}
                            {contactsFlattened.length > 0 && (
                                <div className="px-5 py-3 border-t text-xs text-muted-foreground">
                                    Showing {contactsFlattened.length} of {contactsFlattened.length} contacts
                                    {activeSegmentId && (
                                        <> in <span className="font-medium">
                                            {segmentItems.find((s) => s.id === activeSegmentId)?.name}
                                        </span></>
                                    )}
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            </div>

            {/* Move to Segment dialog (shared for single + bulk) */}
            <MoveToSegmentDialog
                open={moveDialogIds !== null}
                onOpenChange={(o) => { if (!o) setMoveDialogIds(null); }}
                count={moveDialogIds?.length ?? 0}
                onMove={(segName) => {
                    if (!moveDialogIds) return;
                    const ids = new Set(moveDialogIds);
                    // setContacts((prev) =>
                    //     prev.map((c) => ids.has(c.id) ? { ...c, segment: segName } : c)
                    // );
                    setSelected((prev) => {
                        const next = new Set(prev);
                        moveDialogIds.forEach((id) => next.delete(id));
                        return next;
                    });
                    setMoveDialogIds(null);
                }}
            />
        </DashboardLayout>
    );
}
