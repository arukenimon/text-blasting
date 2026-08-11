import type { Metadata } from "next";
import Link from "next/link";
import {
    ArrowRight,
    BadgeCheck,
    BarChart3,
    CheckCircle2,
    Clock3,
    FileText,
    RadioTower,
    ShieldCheck,
    Smartphone,
    Users,
    Webhook,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
    title: "Text Blasting | SMS Campaign Management Platform",
    description:
        "Text Blasting helps teams create, schedule, send, and track SMS campaigns with audience segments, reusable templates, delivery webhooks, and Supabase-powered reporting.",
    keywords: [
        "SMS campaign management",
        "bulk SMS platform",
        "text message marketing software",
        "SMS gateway dashboard",
        "Supabase SMS app",
        "SMS delivery tracking",
    ],
    alternates: {
        canonical: "/",
    },
    openGraph: {
        title: "Text Blasting | SMS Campaign Management Platform",
        description:
            "Manage bulk SMS campaigns, audience segments, reusable templates, gateway credentials, webhooks, and delivery reporting in one focused dashboard.",
        url: siteUrl,
        siteName: "Text Blasting",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Text Blasting | SMS Campaign Management Platform",
        description:
            "Create, schedule, and track SMS campaigns with audience segmentation, templates, and webhook-based delivery sync.",
    },
};

const features = [
    {
        title: "Campaign scheduling",
        description: "Create draft, scheduled, and immediate SMS campaigns with status-aware delivery workflows.",
        icon: Clock3,
    },
    {
        title: "Audience segmentation",
        description: "Group contacts into clean, reusable segments so every broadcast starts with the right list.",
        icon: Users,
    },
    {
        title: "Reusable templates",
        description: "Build SMS templates with personalization variables and character-count visibility.",
        icon: FileText,
    },
    {
        title: "Delivery event sync",
        description: "Receive sent, delivered, failed, and inbound webhook events for reliable campaign tracking.",
        icon: Webhook,
    },
];

const metrics = [
    { label: "Campaign states", value: "6", detail: "draft to completed" },
    { label: "SMS segment target", value: "160", detail: "chars kept visible" },
    { label: "Webhook events", value: "Real-time", detail: "delivery and replies" },
];

const workflow = [
    "Import contacts or create focused audience segments.",
    "Write reusable templates with personalization variables.",
    "Schedule a campaign or send immediately from the dashboard.",
    "Track message status through gateway webhooks and reporting views.",
];

const faqs = [
    {
        question: "What is Text Blasting built for?",
        answer:
            "Text Blasting is built for managing outbound SMS campaigns from one admin dashboard: contacts, segments, templates, scheduling, gateway settings, and delivery status.",
    },
    {
        question: "Can it work with local and cloud SMS gateways?",
        answer:
            "Yes. The app includes settings for cloud gateway credentials and local gateway connection details, plus webhook registration for delivery events.",
    },
    {
        question: "Does the dashboard track delivery results?",
        answer:
            "Yes. Message records and webhook event processing are designed to keep sent, delivered, failed, and received states visible to the admin experience.",
    },
];

const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "WebSite",
            "@id": `${siteUrl}/#website`,
            name: "Text Blasting",
            url: siteUrl,
            description:
                "SMS campaign management platform for creating, scheduling, and tracking bulk text message campaigns.",
        },
        {
            "@type": "SoftwareApplication",
            "@id": `${siteUrl}/#software`,
            name: "Text Blasting",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            url: siteUrl,
            description:
                "A web dashboard for SMS campaign management, audience segmentation, reusable templates, SMS gateway settings, webhooks, and delivery reporting.",
            featureList: [
                "SMS campaign scheduling",
                "Audience segment management",
                "Reusable SMS templates",
                "SMS gateway configuration",
                "Webhook delivery tracking",
                "Admin dashboard reporting",
            ],
        },
    ],
};

export default function Home() {
    return (
        <main className="bg-background text-foreground">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />

            <section className="relative isolate min-h-[88svh] overflow-hidden bg-slate-950 text-white">
                <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:72px_72px]" />

                <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
                    <Link href="/" className="flex items-center gap-3" aria-label="Text Blasting home">
                        <span className="flex size-10 items-center justify-center rounded-lg bg-emerald-300 text-sm font-black text-slate-950">
                            TB
                        </span>
                        <span>
                            <span className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-100/75">
                                SMS Ops
                            </span>
                            <span className="font-semibold">Text Blasting</span>
                        </span>
                    </Link>
                    <nav aria-label="Main navigation" className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
                        <a href="#features" className="hover:text-white">Features</a>
                        <a href="#workflow" className="hover:text-white">Workflow</a>
                        <a href="#faq" className="hover:text-white">FAQ</a>
                    </nav>
                    <div className="flex items-center gap-2">
                        <Button asChild size="sm" variant="ghost" className="hidden text-white hover:bg-white/[0.10] hover:text-white sm:inline-flex">
                            <Link href="/login">Sign in</Link>
                        </Button>
                        <Button asChild size="sm" className="bg-emerald-300 text-slate-950 hover:bg-emerald-200">
                            <Link href="/register">Create account</Link>
                        </Button>
                    </div>
                </header>

                <div className="relative z-10 mx-auto grid min-h-[calc(88svh-80px)] max-w-7xl items-center gap-10 px-4 pb-14 pt-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(380px,500px)] lg:px-8 xl:grid-cols-[minmax(0,1fr)_minmax(480px,560px)]">
                    <div className="max-w-3xl">
                        <Badge className="mb-6 border-emerald-200/30 bg-emerald-300/[0.10] text-emerald-100">
                            SMS campaign management platform
                        </Badge>
                        <h1 className="max-w-2xl text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
                            Text Blasting
                        </h1>
                        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
                            Create, schedule, send, and track bulk SMS campaigns with audience segments,
                            reusable templates, gateway settings, and webhook-powered delivery reporting.
                        </p>
                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <Button asChild size="lg" className="bg-emerald-300 text-slate-950 hover:bg-emerald-200">
                                <Link href="/register">
                                    Create account <ArrowRight className="size-4" />
                                </Link>
                            </Button>
                            <Button asChild size="lg" variant="outline" className="border-white/20 bg-white/[0.08] text-white hover:bg-white/[0.14] hover:text-white">
                                <a href="#features">Explore features</a>
                            </Button>
                        </div>
                    </div>
                    <div className="hidden min-w-0 opacity-70 lg:block">
                        <div className="rounded-lg border border-white/[0.14] bg-white/[0.08] p-4 shadow-2xl shadow-black/30 backdrop-blur">
                            <div className="mb-4 flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
                                        Live operations
                                    </p>
                                    <p className="mt-1 text-lg font-semibold">Campaign queue</p>
                                </div>
                                <Badge className="bg-emerald-300 text-slate-950">Healthy</Badge>
                            </div>
                            <div className="grid gap-3 xl:grid-cols-3">
                                {["Messages Sent", "Delivery Rate", "Reply Rate"].map((label, index) => (
                                    <div key={label} className="rounded-md border border-white/10 bg-slate-900/80 p-3">
                                        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">{label}</p>
                                        <p className="mt-3 text-2xl font-semibold">
                                            {index === 0 ? "12,480" : index === 1 ? "98.2%" : "14.7%"}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 space-y-2">
                                {[
                                    ["Spring Promo Wave 2", "Scheduled", "High-value Prospects"],
                                    ["Order Pickup Alert", "Running", "Transactional"],
                                    ["Winback Offer", "Draft", "Dormant Contacts"],
                                ].map(([name, status, segment]) => (
                                    <div key={name} className="grid gap-1 rounded-md border border-white/10 bg-white/[0.06] px-3 py-3 text-sm xl:grid-cols-[1.25fr_0.65fr_1fr] xl:items-center xl:gap-3">
                                        <span className="font-medium">{name}</span>
                                        <span className="text-slate-300">{status}</span>
                                        <span className="text-slate-400">{segment}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section aria-label="Platform metrics" className="border-b bg-card">
                <div className="mx-auto grid max-w-7xl gap-px border-x bg-border sm:grid-cols-3">
                    {metrics.map((metric) => (
                        <div key={metric.label} className="bg-card px-5 py-6">
                            <p className="text-sm font-semibold text-muted-foreground">{metric.label}</p>
                            <p className="mt-2 text-3xl font-semibold tracking-tight">{metric.value}</p>
                            <p className="mt-1 text-sm text-muted-foreground">{metric.detail}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section id="features" className="px-4 py-20 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <div className="max-w-3xl">
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Features</p>
                        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                            Everything needed to run SMS campaigns from one dashboard.
                        </h2>
                        <p className="mt-4 text-base leading-7 text-muted-foreground">
                            Text Blasting connects the operational pieces that matter: recipients, message copy,
                            delivery timing, gateway credentials, and event tracking.
                        </p>
                    </div>

                    <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {features.map(({ title, description, icon: Icon }) => (
                            <article key={title} className="rounded-lg border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <Icon className="size-5" />
                                </div>
                                <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                                <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section id="workflow" className="border-y bg-card px-4 py-20 sm:px-6 lg:px-8">
                <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Workflow</p>
                        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                            Go from contact list to measured campaign without tool-hopping.
                        </h2>
                        <p className="mt-4 text-base leading-7 text-muted-foreground">
                            The admin flow is designed for repeated campaign work: prepare the audience, write the
                            message, choose timing, then track outcomes from the same workspace.
                        </p>
                    </div>

                    <ol className="grid gap-3">
                        {workflow.map((step, index) => (
                            <li key={step} className="flex gap-4 rounded-lg border bg-background p-4">
                                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
                                    {index + 1}
                                </span>
                                <span className="self-center text-sm font-medium">{step}</span>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            <section className="px-4 py-20 sm:px-6 lg:px-8">
                <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-3">
                    {[
                        {
                            title: "Gateway-ready",
                            body: "Configure cloud or local SMS gateway credentials and register webhook endpoints for message events.",
                            icon: RadioTower,
                        },
                        {
                            title: "Compliance-aware operations",
                            body: "Keep opt-out and delivery health visible while organizing audiences for targeted sends.",
                            icon: ShieldCheck,
                        },
                        {
                            title: "Reporting foundation",
                            body: "Use message records, event dedupe, and campaign statuses to support clearer performance reporting.",
                            icon: BarChart3,
                        },
                    ].map(({ title, body, icon: Icon }) => (
                        <article key={title} className="rounded-lg border bg-card p-6">
                            <Icon className="size-5 text-primary" />
                            <h2 className="mt-5 text-xl font-semibold">{title}</h2>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section id="faq" className="border-y bg-muted/45 px-4 py-20 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-4xl">
                    <div className="text-center">
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">FAQ</p>
                        <h2 className="mt-3 text-3xl font-semibold tracking-tight">SMS campaign software questions</h2>
                    </div>
                    <div className="mt-10 divide-y rounded-lg border bg-card">
                        {faqs.map(({ question, answer }) => (
                            <article key={question} className="p-5">
                                <h3 className="flex items-start gap-2 text-base font-semibold">
                                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                                    {question}
                                </h3>
                                <p className="mt-2 pl-6 text-sm leading-6 text-muted-foreground">{answer}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="px-4 py-20 sm:px-6 lg:px-8">
                <div className="mx-auto flex max-w-7xl flex-col gap-6 rounded-lg bg-slate-950 p-6 text-white sm:p-8 lg:flex-row lg:items-center lg:justify-between">
                    <div className="max-w-2xl">
                        <Badge className="mb-4 bg-emerald-300 text-slate-950">
                            <BadgeCheck className="size-3" />
                            Built for SMS operations
                        </Badge>
                        <h2 className="text-3xl font-semibold tracking-tight">Ready to manage your next text campaign?</h2>
                        <p className="mt-3 text-sm leading-6 text-slate-300">
                            Create an account or sign in to manage contacts, templates, campaign scheduling, gateway settings, and webhook delivery events.
                        </p>
                    </div>
                    <Button asChild size="lg" className="bg-emerald-300 text-slate-950 hover:bg-emerald-200">
                        <Link href="/register">
                            Create account <ArrowRight className="size-4" />
                        </Link>
                    </Button>
                </div>
            </section>

            <footer className="border-t px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                        <Smartphone className="size-4 text-primary" />
                        <span>Text Blasting SMS Campaign Management</span>
                    </div>
                    <Link href="/register" className="font-semibold text-foreground hover:text-primary">
                        Create admin account
                    </Link>
                </div>
            </footer>
        </main>
    );
}
