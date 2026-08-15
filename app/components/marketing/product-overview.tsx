"use client";

import { useState, type ElementType } from "react";
import {
    Check,
    CheckCircle2,
    Clock3,
    FileSpreadsheet,
    FileText,
    RadioTower,
    Send,
    Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

type TourStep = {
    eyebrow: string;
    title: string;
    description: string;
    icon: ElementType;
};

const steps: TourStep[] = [
    {
        eyebrow: "Connect",
        title: "Connect SMS Gate",
        description: "Connect an Android device to SMS Gate, save the workspace cloud credentials, and register delivery webhooks.",
        icon: RadioTower,
    },
    {
        eyebrow: "Organize",
        title: "Prepare your audience",
        description: "Add contacts manually or import a NAME and PHONE CSV, then group recipients into reusable segments.",
        icon: Users,
    },
    {
        eyebrow: "Create",
        title: "Write and schedule",
        description: "Start from a reusable template or write campaign copy, choose an audience, and send now or schedule it.",
        icon: FileText,
    },
    {
        eyebrow: "Monitor",
        title: "Follow delivery results",
        description: "Watch sent, delivered, queued, and failed states update as SMS Gate delivery events arrive.",
        icon: CheckCircle2,
    },
];

function GatewayPreview() {
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border bg-background p-4">
                <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-700">
                        <RadioTower className="size-5" />
                    </span>
                    <div>
                        <p className="text-sm font-semibold">SMS Gate cloud</p>
                        <p className="text-xs text-muted-foreground">Android device connection</p>
                    </div>
                </div>
                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                    <span className="mr-1.5 size-1.5 rounded-full bg-emerald-500" /> Connected
                </Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
                {[
                    ["Sender devices", "2 active"],
                    ["SMS Gate webhooks", "Registered"],
                ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border bg-background p-4">
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="mt-1 text-sm font-semibold">{value}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function AudiencePreview() {
    return (
        <div className="overflow-hidden rounded-lg border bg-background">
            <div className="flex items-center justify-between border-b px-4 py-3">
                <div className="flex items-center gap-2">
                    <FileSpreadsheet className="size-4 text-primary" />
                    <span className="text-sm font-semibold">contacts.csv</span>
                </div>
                <Badge variant="secondary">Ready to import</Badge>
            </div>
            <div className="divide-y text-sm">
                {[
                    ["Ana Reyes", "+63 ••• ••• 2184", "Customers"],
                    ["Paolo Cruz", "+63 ••• ••• 7712", "Customers"],
                    ["Mika Santos", "+63 ••• ••• 4096", "Leads"],
                ].map(([name, phone, segment]) => (
                    <div key={name} className="grid grid-cols-[1fr_1fr_auto] items-center gap-3 px-4 py-3">
                        <span className="font-medium">{name}</span>
                        <span className="text-xs text-muted-foreground">{phone}</span>
                        <span className="rounded-full bg-primary/8 px-2 py-1 text-[11px] font-medium text-primary">{segment}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function CampaignPreview() {
    return (
        <div className="space-y-3 rounded-lg border bg-background p-4">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-sm font-semibold">Pickup reminder</p>
                    <p className="text-xs text-muted-foreground">Customers · 248 contacts</p>
                </div>
                <Badge variant="secondary"><Clock3 className="size-3" /> Scheduled</Badge>
            </div>
            <div className="rounded-lg border bg-muted/40 p-3 text-sm leading-6 text-foreground">
                Hi {"{{full_name}}"}, your order is ready for pickup. Please show this message at the counter.
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>112 / 160 characters</span>
                <span className="flex items-center gap-1.5 font-medium text-foreground"><Send className="size-3.5 text-primary" /> Send tomorrow, 9:00 AM</span>
            </div>
        </div>
    );
}

function ReportsPreview() {
    const statuses = [
        { label: "Delivered", value: "231", width: "93%", color: "bg-emerald-500" },
        { label: "Sent", value: "11", width: "28%", color: "bg-sky-500" },
        { label: "Queued", value: "4", width: "15%", color: "bg-blue-500" },
        { label: "Failed", value: "2", width: "8%", color: "bg-red-500" },
    ];

    return (
        <div className="space-y-4 rounded-lg border bg-background p-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-semibold">Delivery status</p>
                    <p className="text-xs text-muted-foreground">Outbound messages</p>
                </div>
                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">93% delivered</Badge>
            </div>
            <div className="space-y-3">
                {statuses.map((status) => (
                    <div key={status.label} className="grid grid-cols-[72px_1fr_28px] items-center gap-3 text-xs">
                        <span className="font-medium">{status.label}</span>
                        <span className="h-2 overflow-hidden rounded-full bg-muted">
                            <span className={`block h-full rounded-full ${status.color}`} style={{ width: status.width }} />
                        </span>
                        <span className="text-right tabular-nums text-muted-foreground">{status.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

const previews = [GatewayPreview, AudiencePreview, CampaignPreview, ReportsPreview];

export function ProductOverview() {
    const [activeStep, setActiveStep] = useState(0);
    const Preview = previews[activeStep];

    return (
        <div className="grid overflow-hidden rounded-2xl border bg-card shadow-[0_24px_70px_-42px_rgba(15,23,42,0.5)] lg:grid-cols-[0.9fr_1.1fr]">
            <div className="border-b p-3 sm:p-4 lg:border-b-0 lg:border-r">
                <div role="tablist" aria-label="How Text Blasting works" className="grid gap-1.5">
                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        const active = activeStep === index;
                        return (
                            <button
                                key={step.title}
                                type="button"
                                role="tab"
                                aria-selected={active}
                                aria-controls="product-overview-panel"
                                onClick={() => setActiveStep(index)}
                                className={`group flex gap-3 rounded-xl p-3 text-left transition-colors sm:p-4 ${
                                    active ? "bg-slate-950 text-white" : "hover:bg-muted/70"
                                }`}
                            >
                                <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                                    active ? "bg-emerald-300 text-slate-950" : "bg-primary/10 text-primary"
                                }`}>
                                    {active ? <Check className="size-4" /> : <Icon className="size-4" />}
                                </span>
                                <span className="min-w-0">
                                    <span className={`block text-[11px] font-semibold uppercase tracking-[0.16em] ${active ? "text-emerald-200" : "text-muted-foreground"}`}>
                                        {index + 1}. {step.eyebrow}
                                    </span>
                                    <span className="mt-1 block text-sm font-semibold sm:text-base">{step.title}</span>
                                    <span className={`mt-1 hidden text-xs leading-5 sm:block ${active ? "text-slate-300" : "text-muted-foreground"}`}>
                                        {step.description}
                                    </span>
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div
                id="product-overview-panel"
                role="tabpanel"
                className="relative flex min-h-[390px] flex-col justify-center overflow-hidden bg-[linear-gradient(145deg,rgba(248,250,252,0.96),rgba(236,253,245,0.75))] p-5 sm:p-8 lg:p-10"
            >
                <div className="absolute -right-20 -top-20 size-64 rounded-full bg-emerald-300/20 blur-3xl" />
                <div className="relative" key={activeStep}>
                    <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">In the dashboard</p>
                        <h3 className="mt-2 text-2xl font-semibold tracking-tight">{steps[activeStep].title}</h3>
                        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground sm:hidden">
                            {steps[activeStep].description}
                        </p>
                        <div className="mt-6">
                            <Preview />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
