"use client";

import { useEffect, useRef, useState, type ElementType } from "react";
import {
    CheckCircle2,
    Link2,
    RadioTower,
    Send,
    Signal,
    Smartphone,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

type WalkthroughStep = {
    eyebrow: string;
    title: string;
    description: string;
    detail: string;
    icon: ElementType;
};

const steps: WalkthroughStep[] = [
    {
        eyebrow: "01 · Install",
        title: "Set up your Android gateway",
        description: "Install SMS Gateway for Android on a phone with an active SIM, then keep it online for sending.",
        detail: "Android phone · active SIM",
        icon: Smartphone,
    },
    {
        eyebrow: "02 · Connect",
        title: "Pair it with SMS Gate cloud",
        description: "Use your SMS Gate cloud credentials in Relay Campaigns. The dashboard recognizes the connected phone as a sender device.",
        detail: "Device connection verified",
        icon: Link2,
    },
    {
        eyebrow: "03 · Prepare",
        title: "Create a campaign in Relay",
        description: "Choose your audience, write the message, and decide whether to send immediately or schedule it for later.",
        detail: "Customers · 248 recipients",
        icon: Send,
    },
    {
        eyebrow: "04 · Send",
        title: "Your phone sends through its SIM",
        description: "Relay sends the campaign to SMS Gate, which hands each message to your Android phone for carrier delivery.",
        detail: "Sending via Android Gateway",
        icon: RadioTower,
    },
    {
        eyebrow: "05 · Track",
        title: "Watch delivery results return",
        description: "Webhook updates flow back into Relay, so your team can follow sent, delivered, queued, and failed messages in one place.",
        detail: "Live delivery events",
        icon: CheckCircle2,
    },
];

function PhoneScreen({ activeStep }: { activeStep: number }) {
    const tab = activeStep === 3 ? "Messages" : activeStep === 4 ? "Settings" : "Home";

    return (
        <div key={activeStep} className="-mx-3 -mb-3 -mt-3 overflow-hidden rounded-[18px] bg-[#121212] text-white animate-in fade-in zoom-in-95 duration-500 motion-reduce:animate-none">
            <div className="flex items-center justify-between bg-violet-800 px-2.5 py-1 text-[6px] font-semibold"><span>5:00&nbsp;&nbsp;● ●</span><span>▴ 4G&nbsp;&nbsp;⌁&nbsp;&nbsp;43%</span></div>
            <div className="grid grid-cols-3 border-b border-white/10 text-[6px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                {["Home", "Messages", "Settings"].map((item) => <div key={item} className={`relative py-2 text-center ${tab === item ? "text-violet-300" : ""}`}><span className="block text-[9px] leading-none">{item === "Home" ? "⌂" : item === "Messages" ? "▣" : "⚙"}</span><span className="mt-1 block">{item}</span>{tab === item && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-violet-400" />}</div>)}
            </div>
            <div className="min-h-[178px] p-2.5 text-[7px]">
                {activeStep < 2 && <>
                    <div className="rounded-md bg-lime-500 px-2 py-1.5 text-center font-medium text-lime-950">Internet connection: available</div>
                    <div className="mt-2 rounded-lg bg-zinc-800 p-2"><div className="flex items-center justify-between"><span className="font-semibold text-zinc-100">▯&nbsp; Local server</span><span className="size-3 rounded-full bg-zinc-600" /></div></div>
                    <div className="mt-1.5 rounded-lg bg-zinc-800 p-2"><div className="flex items-center justify-between"><span className="font-semibold text-zinc-100">☁&nbsp; Cloud server</span><span className="flex size-4 items-center rounded-full bg-teal-700 p-0.5"><span className="ml-auto size-3 rounded-full bg-teal-400" /></span></div>{activeStep === 0 ? <p className="mt-2 text-zinc-500">Add cloud credentials to pair this phone.</p> : <div className="mt-2 space-y-1.5 text-zinc-400"><p>Server&nbsp; <span className="text-teal-300">api.sms-gate.app:443</span></p><p>Username&nbsp; <span className="text-teal-300">••••••••</span></p><p>Password&nbsp; <span className="text-teal-300">••••••••</span></p><p>Device ID&nbsp; <span className="text-teal-300">••••-••••</span></p></div>}</div>
                    <div className="mt-2 flex items-center justify-between text-zinc-400"><span>Start on boot</span><span className="size-3 rounded-full bg-zinc-600" /></div>
                    <div className={`mt-2 border-b-2 py-1.5 text-center font-semibold ${activeStep === 0 ? "border-zinc-500 bg-zinc-600" : "border-teal-400 bg-zinc-600"}`}>{activeStep === 0 ? "OFFLINE" : "ONLINE"}</div>
                </>}
                {activeStep === 2 && <><p className="text-teal-300">Messages</p><div className="mt-2 rounded-lg border border-teal-300/25 bg-teal-300/10 p-2"><p className="font-semibold text-white">Pickup reminder</p><p className="mt-1 text-zinc-400">248 messages received from Relay.</p><div className="mt-2 flex items-center gap-1 text-teal-300"><Signal className="size-2.5" /> Waiting for schedule</div></div><p className="mt-4 text-zinc-500">The Android gateway stays ready in the background.</p></>}
                {activeStep === 3 && <><div className="flex items-center justify-between"><p className="text-teal-300">Sending campaign</p><span className="rounded bg-teal-300 px-1 text-[6px] font-bold text-zinc-950">LIVE</span></div><div className="mt-2 space-y-1.5">{["+63 917 ••• 2184", "+63 927 ••• 7712", "+63 905 ••• 4096"].map((number, index) => <div key={number} className="flex items-center justify-between rounded bg-zinc-800 px-2 py-1.5"><span className="text-zinc-300">{number}</span><span className={index === 2 ? "text-sky-300" : "text-teal-300"}>{index === 2 ? "Sending" : "Sent"}</span></div>)}</div><div className="mt-3 h-1 overflow-hidden rounded-full bg-zinc-800"><span className="block h-full w-3/4 bg-teal-400" /></div></>}
                {activeStep === 4 && <><p className="text-teal-300">Webhooks</p><div className="mt-2 rounded-lg bg-zinc-800 p-2"><p className="font-semibold text-zinc-100">Require internet connection</p><p className="mt-1 text-zinc-500">Wait before retrying a webhook.</p></div><div className="mt-2 space-y-1.5 text-zinc-400">{["sms:sent", "sms:delivered", "sms:failed"].map((event) => <div key={event} className="border-b border-white/10 pb-1.5"><p className="text-zinc-200">relaycampaigns.app/••••</p><p className="mt-0.5 text-teal-300">Cloud&nbsp;&nbsp; {event}</p></div>)}</div></>}
            </div>
        </div>
    );
}

function DashboardScreen({ activeStep }: { activeStep: number }) {
    const sending = activeStep >= 3;
    const complete = activeStep === 4;

    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20">
            <div className="flex h-8 items-center gap-1.5 border-b bg-slate-50 px-3"><span className="size-1.5 rounded-full bg-red-300" /><span className="size-1.5 rounded-full bg-amber-300" /><span className="size-1.5 rounded-full bg-emerald-300" /><span className="ml-2 h-4 w-24 rounded bg-slate-200/80" /></div>
            <div className="grid min-h-[240px] grid-cols-[60px_1fr] sm:min-h-[310px] sm:grid-cols-[84px_1fr]">
                <aside className="border-r bg-slate-950 p-2.5 sm:p-3"><span className="flex size-6 items-center justify-center rounded-md bg-emerald-300 text-[8px] font-black text-slate-950">RC</span><div className="mt-5 space-y-2">{[0, 1, 2, 3].map((item) => <span key={item} className={`block h-1.5 rounded-full ${item === Math.min(activeStep, 3) ? "bg-emerald-300" : "bg-slate-700"}`} />)}</div></aside>
                <div className="p-3 sm:p-5" key={activeStep}>
                    <div className="flex items-start justify-between"><div><p className="text-[7px] font-semibold uppercase tracking-[0.16em] text-emerald-700 sm:text-[9px]">{steps[activeStep].eyebrow}</p><p className="mt-1 text-[11px] font-semibold text-slate-900 sm:text-sm">{activeStep < 2 ? "Gateway settings" : activeStep === 2 ? "New campaign" : "Campaign results"}</p></div><span className={`rounded-full px-1.5 py-1 text-[7px] font-semibold sm:px-2 sm:text-[8px] ${complete ? "bg-emerald-100 text-emerald-700" : sending ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-500"}`}>{complete ? "Complete" : sending ? "Sending" : "Draft"}</span></div>
                    {activeStep < 2 ? <div className="mt-4 rounded-lg border border-slate-200 p-2.5 sm:p-3"><div className="flex items-center gap-2"><span className="flex size-5 items-center justify-center rounded-md bg-emerald-100 text-emerald-700"><Smartphone className="size-3" /></span><div><p className="text-[8px] font-semibold text-slate-800 sm:text-[10px]">Android Gateway</p><p className="text-[7px] text-slate-400 sm:text-[8px]">Samsung Galaxy A54</p></div><span className="ml-auto size-1.5 rounded-full bg-emerald-500" /></div><div className="mt-3 grid grid-cols-2 gap-2">{["Cloud API", "Webhooks"].map((label) => <div key={label} className="rounded bg-slate-50 p-2"><p className="text-[7px] text-slate-400">{label}</p><p className="mt-1 text-[8px] font-semibold text-emerald-700">Verified</p></div>)}</div></div> : <><div className="mt-4 rounded-lg border border-slate-200 p-2.5 sm:p-3"><p className="text-[7px] text-slate-400 sm:text-[8px]">Campaign</p><p className="mt-1 text-[9px] font-semibold text-slate-800 sm:text-[11px]">Pickup reminder</p><p className="mt-2 rounded bg-slate-50 p-2 text-[7px] leading-3 text-slate-500 sm:text-[8px]">Hi &#123;&#123;full_name&#125;&#125;, your order is ready for pickup.</p></div><div className="mt-3 grid grid-cols-3 gap-2">{[["Queued", sending ? "0" : "248"], ["Sent", sending ? "11" : "0"], ["Delivered", complete ? "231" : "0"]].map(([label, value]) => <div key={label} className="rounded bg-slate-50 p-2"><p className="text-[7px] text-slate-400">{label}</p><p className="mt-1 text-[10px] font-semibold text-slate-800 sm:text-xs">{value}</p></div>)}</div></>}</div>
            </div>
        </div>
    );
}

export function AndroidGatewayWalkthrough() {
    const [activeStep, setActiveStep] = useState(0);
    const stepRefs = useRef<(HTMLElement | null)[]>([]);
    const StepIcon = steps[activeStep].icon;

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const current = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
                if (current) setActiveStep(Number(current.target.getAttribute("data-step")));
            },
            { rootMargin: "-32% 0px -42%", threshold: [0.15, 0.45, 0.7] },
        );

        stepRefs.current.forEach((step) => step && observer.observe(step));
        return () => observer.disconnect();
    }, []);

    return (
        <div className="mx-auto mt-12 max-w-7xl lg:mt-16">
            <div className="relative h-[500svh]">
                <div className="sticky top-5 h-[calc(100svh-2.5rem)] min-h-[560px] py-1 sm:top-8 sm:h-[calc(100svh-4rem)] sm:py-4">
                    <div className="relative flex h-full items-center overflow-hidden rounded-3xl bg-slate-950 p-5 shadow-[0_35px_90px_-38px_rgba(15,23,42,0.7)] sm:p-8 lg:p-12">
                        <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:36px_36px]" />
                        <div className="absolute -left-28 top-1/4 size-72 rounded-full bg-emerald-400/20 blur-3xl sm:size-96" />
                        <div className="absolute -right-28 bottom-0 size-72 rounded-full bg-sky-500/20 blur-3xl sm:size-[32rem]" />

                        <div className="relative grid w-full gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-end lg:gap-12">
                            <div className="order-2 self-end text-white lg:order-1 lg:pb-10" aria-live="polite">
                                <div key={activeStep} className="animate-in fade-in slide-in-from-bottom-4 duration-500 motion-reduce:animate-none">
                                    <div className="flex items-center gap-3">
                                        <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-300 text-slate-950"><StepIcon className="size-5" /></span>
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200">{steps[activeStep].eyebrow}</p>
                                    </div>
                                    <h3 className="mt-5 max-w-md text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">{steps[activeStep].title}</h3>
                                    <p className="mt-4 max-w-md text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">{steps[activeStep].description}</p>
                                    <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-2 text-xs font-medium text-emerald-100"><span className="size-1.5 rounded-full bg-emerald-300" />{steps[activeStep].detail}</div>
                                </div>
                            </div>

                            <div className="order-1 lg:order-2">
                                <div className="mb-5 flex items-center justify-between text-white">
                                    <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200">Android Gateway Tour</p><p className="mt-1 text-sm font-semibold">Scroll to follow the message</p></div>
                                    <Badge className="border-white/10 bg-white/[0.08] text-slate-200">{String(activeStep + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}</Badge>
                                </div>
                                <div className="relative mx-auto max-w-[700px] pb-28 pt-4 sm:pb-40"><DashboardScreen activeStep={activeStep} /><div className="absolute -bottom-4 left-1/2 w-[194px] -translate-x-1/2 rounded-[30px] border-[6px] border-slate-700 bg-slate-900 p-3.5 shadow-2xl shadow-black/50 sm:w-[230px]"><div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-700" /><PhoneScreen activeStep={activeStep} /></div></div>
                                <div className="mt-4 flex items-center justify-center gap-1.5" aria-label={`Step ${activeStep + 1} of ${steps.length}`}>{steps.map((step, index) => <span key={step.title} className={`h-1.5 rounded-full transition-all duration-500 motion-reduce:transition-none ${index === activeStep ? "w-7 bg-emerald-300" : index < activeStep ? "w-2 bg-emerald-300/55" : "w-2 bg-white/20"}`} />)}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pointer-events-none absolute inset-x-0 top-0" aria-hidden="true">
                    {steps.map((step, index) => <div key={step.title} ref={(element) => { stepRefs.current[index] = element; }} data-step={index} className="h-[100svh]" />)}
                </div>
            </div>
            <ol className="sr-only">{steps.map((step) => <li key={step.title}>{step.title}: {step.description}</li>)}</ol>
        </div>
    );
}
