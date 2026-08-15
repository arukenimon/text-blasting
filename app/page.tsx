import type { Metadata } from "next";
import Link from "next/link";
import {
    ArrowRight,
    BadgeCheck,
    BarChart3,
    CheckCircle2,
    Clock3,
    FileText,
    ExternalLink,
    RadioTower,
    ShieldCheck,
    Smartphone,
    Users,
    Webhook,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductOverview } from "@/app/components/marketing/product-overview";
import { Reveal } from "@/app/components/marketing/reveal";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:3000";

export const metadata: Metadata = {
    title: "SMS Gate Campaign Dashboard | Text Blasting",
    description:
        "An independent project built on SMS Gate for importing contacts, scheduling outbound campaigns, and tracking delivery from shared workspaces.",
    keywords: [
        "SMS Gate campaign dashboard",
        "SMS Gateway for Android dashboard",
        "SMS campaign management",
        "SMS scheduling software",
        "SMS audience segmentation",
        "team SMS dashboard",
        "SMS delivery tracking",
    ],
    alternates: {
        canonical: "/",
    },
    openGraph: {
        title: "SMS Gate Campaign Dashboard | Text Blasting",
        description:
            "A project that adds contacts, segments, scheduling, team workspaces, and delivery reporting around the SMS Gate cloud API.",
        url: siteUrl,
        siteName: "Text Blasting",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "SMS Gate Campaign Dashboard | Text Blasting",
        description:
            "Explore a team campaign dashboard built around SMS Gate and SMS Gateway for Android.",
    },
};

const features = [
    {
        title: "Contact imports & segments",
        description: "Add recipients manually or import a CSV, then organize them into reusable audience segments.",
        icon: Users,
    },
    {
        title: "Flexible campaign sending",
        description: "Send to a complete segment or selected contacts, immediately or at a scheduled time.",
        icon: Clock3,
    },
    {
        title: "Reusable templates",
        description: "Build SMS templates with personalization variables and character-count visibility.",
        icon: FileText,
    },
    {
        title: "Delivery status tracking",
        description: "Use SMS Gate webhooks to follow queued, sent, delivered, and failed outbound message states.",
        icon: Webhook,
    },
];

const metrics = [
    { label: "Gateway layer", value: "SMS Gate", detail: "Android device + cloud API" },
    { label: "Audience options", value: "CSV + manual", detail: "contact entry and segments" },
    { label: "Sending options", value: "Now + later", detail: "immediate or scheduled" },
];

const faqs = [
    {
        question: "What is Text Blasting built for?",
        answer:
            "Text Blasting is an independent project exploring a team operations layer for SMS Gate: contacts, audience segments, templates, campaign scheduling, workspaces, and outbound delivery reporting.",
    },
    {
        question: "What do I need to use this project?",
        answer:
            "You need an Android device running SMS Gateway for Android, an SMS Gate cloud setup, and its API credentials. Text Blasting does not replace the gateway or Android device.",
    },
    {
        question: "How does Text Blasting send messages?",
        answer:
            "Text Blasting queues campaigns through the SMS Gate cloud API. SMS Gate routes each message to a connected Android device, which sends it through the selected SIM.",
    },
    {
        question: "What campaign results are visible?",
        answer:
            "The dashboard and reports focus on outbound status: pending, queued, sent, delivered, and failed messages, plus audience opt-out health.",
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
                "An independent project that adds contact organization, SMS campaign scheduling, and delivery reporting around SMS Gate.",
        },
        {
            "@type": "SoftwareApplication",
            "@id": `${siteUrl}/#software`,
            name: "Text Blasting",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            url: siteUrl,
            description:
                "A project dashboard for contact imports, audience segments, reusable templates, SMS campaign scheduling, SMS Gate configuration, and outbound delivery reporting.",
            softwareRequirements:
                "SMS Gate cloud access and an Android device running SMS Gateway for Android",
            featureList: [
                "Manual and CSV contact import",
                "Audience segment management",
                "Reusable SMS templates",
                "Immediate and scheduled SMS campaigns",
                "SMS Gate cloud API configuration",
                "Outbound delivery status tracking",
                "Team workspaces with role management",
            ],
        },
        {
            "@type": "FAQPage",
            "@id": `${siteUrl}/#faq-schema`,
            mainEntity: faqs.map(({ question, answer }) => ({
                "@type": "Question",
                name: question,
                acceptedAnswer: {
                    "@type": "Answer",
                    text: answer,
                },
            })),
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
                <div className="landing-orb absolute -left-40 top-20 size-[32rem] rounded-full bg-emerald-400/15 blur-3xl" />
                <div className="landing-orb landing-orb-delayed absolute -right-48 bottom-0 size-[34rem] rounded-full bg-sky-500/10 blur-3xl" />

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
                        <a href="#overview" className="hover:text-white">How it works</a>
                        <a href="#faq" className="hover:text-white">FAQ</a>
                        <a href="https://sms-gate.app/" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-white">
                            SMS Gate <ExternalLink className="size-3" />
                        </a>
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
                    <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <Badge className="mb-6 border-emerald-200/30 bg-emerald-300/[0.10] text-emerald-100">
                            Project preview · Built on SMS Gate
                        </Badge>
                        <h1 className="max-w-3xl text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
                            Send the right text. Track every delivery.
                        </h1>
                        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
                            Text Blasting explores a team-friendly campaign layer for SMS Gate: import contacts,
                            build focused audiences, schedule outbound messages, and monitor delivery results.
                        </p>
                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <Button asChild size="lg" className="bg-emerald-300 text-slate-950 hover:bg-emerald-200">
                                <Link href="/register">
                                    Create account <ArrowRight className="size-4" />
                                </Link>
                            </Button>
                            <Button asChild size="lg" variant="outline" className="border-white/20 bg-white/[0.08] text-white hover:bg-white/[0.14] hover:text-white">
                                <a href="#overview">See how it works</a>
                            </Button>
                        </div>
                        <a
                            href="https://docs.sms-gate.app/getting-started/"
                            target="_blank"
                            rel="noreferrer"
                            className="mt-5 inline-flex items-center gap-1.5 text-xs text-slate-400 transition-colors hover:text-emerald-200"
                        >
                            Requires SMS Gateway for Android and an SMS Gate setup
                            <ExternalLink className="size-3" />
                        </a>
                    </div>
                    <div className="landing-float hidden min-w-0 lg:block">
                        <div className="rounded-2xl border border-white/[0.14] bg-white/[0.08] p-4 shadow-2xl shadow-black/30 backdrop-blur-xl">
                            <div className="mb-4 flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
                                        Example overview
                                    </p>
                                    <p className="mt-1 text-lg font-semibold">Campaign queue</p>
                                </div>
                                <Badge className="bg-emerald-300 text-slate-950">Sample data</Badge>
                            </div>
                            <div className="grid gap-3 xl:grid-cols-3">
                                {[
                                    ["Messages Sent", "12,480"],
                                    ["Delivery Rate", "98.2%"],
                                    ["Failed", "18"],
                                ].map(([label, value]) => (
                                    <div key={label} className="rounded-md border border-white/10 bg-slate-900/80 p-3">
                                        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">{label}</p>
                                        <p className="mt-3 text-2xl font-semibold">{value}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 space-y-2">
                                {[
                                    ["Pickup Reminder", "Scheduled", "Customers"],
                                    ["Service Advisory", "Running", "Subscribers"],
                                    ["August Announcement", "Draft", "Team Members"],
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

            <section aria-label="Platform capabilities" className="border-b bg-card">
                <div className="mx-auto grid max-w-7xl gap-px border-x bg-border sm:grid-cols-3">
                    {metrics.map((metric, index) => (
                        <Reveal key={metric.label} delay={index * 90} className="bg-card">
                            <div className="px-5 py-6">
                                <p className="text-sm font-semibold text-muted-foreground">{metric.label}</p>
                                <p className="mt-2 text-3xl font-semibold tracking-tight">{metric.value}</p>
                                <p className="mt-1 text-sm text-muted-foreground">{metric.detail}</p>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </section>

            <section id="features" className="px-4 py-20 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <Reveal className="max-w-3xl">
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Features</p>
                        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                            The practical tools behind every outbound campaign.
                        </h2>
                        <p className="mt-4 text-base leading-7 text-muted-foreground">
                            Prepare recipients and message copy, choose when to send, and follow the delivery states
                            SMS Gate reports—without moving between separate tools.
                        </p>
                    </Reveal>

                    <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {features.map(({ title, description, icon: Icon }, index) => (
                            <Reveal key={title} delay={index * 90} className="h-full">
                                <article className="group h-full rounded-xl border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_18px_45px_-28px_rgba(15,23,42,0.45)]">
                                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                                        <Icon className="size-5" />
                                    </div>
                                    <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
                                </article>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            <section id="overview" className="scroll-mt-4 border-y bg-card px-4 py-20 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <Reveal className="mx-auto max-w-3xl text-center">
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Product overview</p>
                        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                            From SMS Gate setup to delivery reporting in four steps.
                        </h2>
                        <p className="mt-4 text-base leading-7 text-muted-foreground">
                            Select a step to preview the workflow. This is the same order a new workspace follows
                            before sending its first campaign through SMS Gate.
                        </p>
                    </Reveal>
                    <Reveal className="mt-10" delay={120}>
                        <ProductOverview />
                    </Reveal>
                </div>
            </section>

            <section className="px-4 py-20 sm:px-6 lg:px-8">
                <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-3">
                    {[
                        {
                            title: "SMS Gate connection",
                            body: "Owners can save SMS Gate cloud credentials, test connected Android devices, and re-register delivery webhooks.",
                            icon: RadioTower,
                        },
                        {
                            title: "Shared team workspaces",
                            body: "Invite teammates, assign roles, and keep campaigns, contacts, templates, and gateway settings workspace-scoped.",
                            icon: ShieldCheck,
                        },
                        {
                            title: "Outbound delivery reports",
                            body: "Review message volume, delivery and failure rates, campaign performance, and audience health by date range.",
                            icon: BarChart3,
                        },
                    ].map(({ title, body, icon: Icon }, index) => (
                        <Reveal key={title} delay={index * 90} className="h-full">
                            <article className="h-full rounded-xl border bg-card p-6 transition-shadow duration-300 hover:shadow-lg hover:shadow-slate-900/[0.06]">
                                <Icon className="size-5 text-primary" />
                                <h2 className="mt-5 text-xl font-semibold">{title}</h2>
                                <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
                            </article>
                        </Reveal>
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
                            Built around SMS Gate
                        </Badge>
                        <h2 className="text-3xl font-semibold tracking-tight">Ready to manage your next text campaign?</h2>
                        <p className="mt-3 text-sm leading-6 text-slate-300">
                            Create an account or sign in to explore contacts, templates, campaign scheduling, SMS Gate settings, and outbound delivery events.
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
                        <span>Text Blasting · An SMS Gate campaign dashboard project</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <a href="https://sms-gate.app/" target="_blank" rel="noreferrer" className="font-semibold text-foreground hover:text-primary">
                            Visit SMS Gate
                        </a>
                        <Link href="/register" className="font-semibold text-foreground hover:text-primary">
                            Create account
                        </Link>
                    </div>
                </div>
            </footer>
        </main>
    );
}
