"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit2, FileText, Plus, Search, Trash2, Variable } from "lucide-react";
import { DashboardLayout } from "@/app/components/dashboard/dashboard-layout";
import { Topbar } from "@/app/components/dashboard/topbar";
import { type TemplateCategory, type TemplateItem_ } from "@/app/components/dashboard/dashboard-data";
import { useAuth } from "@/app/components/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { add_template, delete_template, update_template } from "./actions";
import { getTemplatesOption } from "./QueryOptions";

const CATEGORIES: TemplateCategory[] = [
    "Promotional",
    "Transactional",
    "Re-engagement",
    "Welcome",
    "Alert",
];

const CATEGORY_COLORS: Record<TemplateCategory, string> = {
    Promotional: "border-violet-200 bg-violet-50 text-violet-700",
    Transactional: "border-sky-200 bg-sky-50 text-sky-700",
    "Re-engagement": "border-amber-200 bg-amber-50 text-amber-700",
    Welcome: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Alert: "border-red-200 bg-red-50 text-red-700",
};

const MAX_SMS_CHARS = 160;
const VARIABLE_SUGGESTIONS = ["{{full_name}}"];

type TemplateErrors = Record<string, string[]>;

function getSmsParts(body: string) {
    return Math.max(1, Math.ceil(body.length / MAX_SMS_CHARS));
}

function TemplateDialog({
    initial,
    trigger,
}: {
    initial?: TemplateItem_;
    trigger: React.ReactNode;
}) {
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [body, setBody] = useState(initial?.body ?? "");
    const [errors, setErrors] = useState<TemplateErrors>({});
    const isEdit = Boolean(initial);

    const charCount = body.length;
    const smsParts = getSmsParts(body);
    const currentLimit = smsParts * MAX_SMS_CHARS;

    const { mutate, isPending } = useMutation({
        mutationFn: (formData: FormData) =>
            initial ? update_template(initial.id, formData) : add_template(undefined, formData),
        onSuccess: (result) => {
            if (result.success) {
                queryClient.invalidateQueries({ queryKey: ["templates"] });
                setOpen(false);
                setErrors({});
                return;
            }

            setErrors(result.errors ?? { form: ["Unable to save template."] });
        },
    });

    function handleOpenChange(nextOpen: boolean) {
        setOpen(nextOpen);
        if (nextOpen) {
            setBody(initial?.body ?? "");
            setErrors({});
        }
    }

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setErrors({});
        mutate(new FormData(event.currentTarget));
    }

    function insertVariable(variable: string) {
        setBody((current) => `${current}${variable}`);
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px]">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <DialogHeader>
                        <DialogTitle>{isEdit ? "Edit Template" : "New Template"}</DialogTitle>
                        <DialogDescription>
                            {isEdit ? "Changes apply to future campaigns." : "Save reusable copy for future campaigns."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
                        <div className="grid gap-1.5">
                            <label className="text-sm font-medium" htmlFor={isEdit ? `template-name-${initial?.id}` : "template-name-new"}>
                                Name
                            </label>
                            <Input
                                id={isEdit ? `template-name-${initial?.id}` : "template-name-new"}
                                name="template_name"
                                defaultValue={initial?.template_name}
                                placeholder="Promo reminder"
                            />
                            {errors.template_name ? (
                                <p className="text-xs text-destructive">{errors.template_name[0]}</p>
                            ) : null}
                        </div>

                        <div className="grid gap-1.5">
                            <label className="text-sm font-medium">Category</label>
                            <Select name="category" defaultValue={initial?.category ?? "Promotional"}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES.map((category) => (
                                        <SelectItem key={category} value={category}>
                                            {category}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.category ? <p className="text-xs text-destructive">{errors.category[0]}</p> : null}
                        </div>
                    </div>

                    <div className="grid gap-1.5">
                        <div className="flex items-center justify-between gap-3">
                            <label className="text-sm font-medium" htmlFor={isEdit ? `template-body-${initial?.id}` : "template-body-new"}>
                                Message
                            </label>
                            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                                {charCount} / {currentLimit} chars
                            </span>
                        </div>
                        <Textarea
                            id={isEdit ? `template-body-${initial?.id}` : "template-body-new"}
                            name="template_body"
                            value={body}
                            onChange={(event) => setBody(event.target.value)}
                            placeholder="Hi {{full_name}}, your update is ready."
                            className="min-h-[150px] resize-none"
                        />
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                            <span>
                                {smsParts} SMS segment{smsParts === 1 ? "" : "s"}
                            </span>
                            <div className="flex items-center gap-1.5">
                                <Variable className="size-3.5" />
                                {VARIABLE_SUGGESTIONS.map((variable) => (
                                    <button
                                        key={variable}
                                        type="button"
                                        onClick={() => insertVariable(variable)}
                                        className="rounded-md border bg-background px-2 py-1 font-mono text-[11px] text-foreground transition-colors hover:bg-muted"
                                    >
                                        {variable}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {errors.template_body ? <p className="text-xs text-destructive">{errors.template_body[0]}</p> : null}
                    </div>

                    {errors.form ? <p className="text-sm text-destructive">{errors.form[0]}</p> : null}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Template"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function TemplateCard({
    template,
    onDelete,
    isDeleting,
}: {
    template: TemplateItem_;
    onDelete: (id: string) => void;
    isDeleting: boolean;
}) {
    const smsParts = getSmsParts(template.body);

    return (
        <Card className="overflow-hidden">
            <CardContent className="grid gap-4 p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold">{template.template_name}</h3>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className={`text-[10px] ${CATEGORY_COLORS[template.category]}`}>
                                {template.category}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                                {template.body.length} chars / {smsParts} segment{smsParts === 1 ? "" : "s"}
                            </span>
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                        <TemplateDialog
                            initial={template}
                            trigger={
                                <Button variant="ghost" size="icon-sm" aria-label={`Edit ${template.template_name}`}>
                                    <Edit2 className="size-4" />
                                </Button>
                            }
                        />
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Delete ${template.template_name}`}
                            disabled={isDeleting}
                            onClick={() => onDelete(template.id)}
                            className="text-destructive hover:text-destructive"
                        >
                            <Trash2 className="size-4" />
                        </Button>
                    </div>
                </div>

                <p className="min-h-[72px] whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                    {template.body}
                </p>
            </CardContent>
        </Card>
    );
}

export default function TemplatesPage() {
    const { activeWorkspace } = useAuth();
    const workspaceId = activeWorkspace?.id;
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<"all" | TemplateCategory>("all");
    const [sortBy, setSortBy] = useState<"newest" | "name" | "length">("newest");

    const { data, isLoading } = useQuery(getTemplatesOption(workspaceId));
    const templates = useMemo<TemplateItem_[]>(() => data ?? [], [data]);

    const filteredTemplates = useMemo(() => {
        const query = search.trim().toLowerCase();

        return templates
            .filter((template) => categoryFilter === "all" || template.category === categoryFilter)
            .filter((template) => {
                if (!query) return true;
                return (
                    template.template_name.toLowerCase().includes(query) ||
                    template.body.toLowerCase().includes(query) ||
                    template.category.toLowerCase().includes(query)
                );
            })
            .sort((a, b) => {
                if (sortBy === "name") return a.template_name.localeCompare(b.template_name);
                if (sortBy === "length") return b.body.length - a.body.length;
                return (b.created_at ?? "").localeCompare(a.created_at ?? "");
            });
    }, [categoryFilter, search, sortBy, templates]);

    const { mutate: deleteTemplate, isPending: isDeleting } = useMutation({
        mutationFn: (id: string) => delete_template(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["templates"] }),
    });

    return (
        <DashboardLayout>
            <div className="flex min-w-0 flex-1 flex-col">
                <Topbar />
                <main className="mt-6 space-y-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-lg font-semibold">Templates</h1>
                            <p className="text-sm text-muted-foreground">
                                {templates.length} saved template{templates.length === 1 ? "" : "s"}
                            </p>
                        </div>
                        <TemplateDialog
                            trigger={
                                <Button size="sm">
                                    <Plus className="mr-1.5 size-4" />
                                    New Template
                                </Button>
                            }
                        />
                    </div>

                    <div className="flex flex-col gap-2 rounded-lg border bg-background p-3 sm:flex-row sm:items-center">
                        <div className="relative min-w-0 flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search templates"
                                className="pl-9"
                            />
                        </div>

                        <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as "all" | TemplateCategory)}>
                            <SelectTrigger className="sm:w-[180px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All categories</SelectItem>
                                {CATEGORIES.map((category) => (
                                    <SelectItem key={category} value={category}>
                                        {category}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={sortBy} onValueChange={(value) => setSortBy(value as "newest" | "name" | "length")}>
                            <SelectTrigger className="sm:w-[160px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="newest">Newest first</SelectItem>
                                <SelectItem value="name">Name A-Z</SelectItem>
                                <SelectItem value="length">Longest first</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {isLoading ? (
                        <div className="rounded-lg border bg-background p-8 text-center text-sm text-muted-foreground">
                            Loading templates...
                        </div>
                    ) : filteredTemplates.length === 0 ? (
                        <div className="rounded-lg border bg-background p-10 text-center">
                            <FileText className="mx-auto mb-3 size-10 text-muted-foreground/50" />
                            <p className="text-sm font-medium">No templates found</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Create one template or adjust the filters above.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                            {filteredTemplates.map((template) => (
                                <TemplateCard
                                    key={template.id}
                                    template={template}
                                    onDelete={deleteTemplate}
                                    isDeleting={isDeleting}
                                />
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </DashboardLayout>
    );
}
