"use client";

import { useState } from "react";
import { CalendarDays, MessageSquareText, Send, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ActivityItem, SegmentItem } from "./dashboard-data";

const MAX_CHARS = 160;

const activityFallback: ActivityItem[] = [
    { event: "Gateway webhooks ready for delivery receipts", time: "Live" },
    { event: "Audience sync waiting for the next import", time: "Today" },
    { event: "Campaign queue is clear", time: "Now" },
];

const activityDots = ["bg-primary", "bg-emerald-500", "bg-amber-400"];

type RightPanelProps = {
    segments: SegmentItem[];
    activities: ActivityItem[];
};

export function RightPanel({ segments, activities }: RightPanelProps) {
    const defaultMsg =
        "Hey {{full_name}}, your early access starts now. Reply YES to claim your offer.";
    const [message, setMessage] = useState(defaultMsg);
    const remaining = MAX_CHARS - message.length;
    const isOverLimit = remaining < 0;
    const visibleActivities = activities.length ? activities : activityFallback;

    return (
        <div className="space-y-4">
            <Card className="py-0">
                <CardHeader className="border-b px-5 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Send className="size-4" />
                        </div>
                        <div>
                            <CardTitle className="text-base">Quick Send Draft</CardTitle>
                            <p className="text-xs text-muted-foreground">Preview a one-off message before making it a campaign.</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 p-5">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                            Audience Segment
                        </label>
                        <Select defaultValue={segments[0]?.name}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select segment" />
                            </SelectTrigger>
                            <SelectContent>
                                {segments.map((segment) => (
                                    <SelectItem key={segment.id} value={segment.name}>
                                        {segment.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                                Message
                            </label>
                            <span
                                className={`text-xs tabular-nums ${
                                    isOverLimit
                                        ? "font-semibold text-destructive"
                                        : remaining < 20
                                            ? "text-amber-600"
                                            : "text-muted-foreground"
                                }`}
                            >
                                {remaining} chars
                            </span>
                        </div>
                        <Textarea
                            rows={5}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className={isOverLimit ? "border-destructive focus-visible:ring-destructive/30" : ""}
                        />
                    </div>

                    <div className="flex gap-2">
                        <Button type="button" className="flex-1" disabled={isOverLimit}>
                            <MessageSquareText />
                            Use as Template
                        </Button>
                        <Button type="button" variant="outline" size="icon" aria-label="Schedule message">
                            <CalendarDays />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="py-0">
                <CardHeader className="flex-row items-center justify-between border-b px-5 py-4">
                    <CardTitle className="text-base">Segments</CardTitle>
                    <Badge variant="secondary">{segments.length}</Badge>
                </CardHeader>
                <CardContent className="space-y-2 p-3">
                    {segments.length === 0 ? (
                        <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                            No audience segments yet.
                        </div>
                    ) : (
                        segments.slice(0, 4).map((segment) => (
                            <div
                                key={segment.id}
                                className="flex items-start gap-3 rounded-md border bg-background p-3 transition-colors hover:bg-accent/50"
                            >
                                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
                                    <Users className="size-4 text-muted-foreground" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="size-2 rounded-full"
                                            style={{ backgroundColor: segment.color_hex }}
                                        />
                                        <p className="truncate text-sm font-semibold">{segment.name}</p>
                                    </div>
                                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                        {segment.description || "No description"}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>

            <Card className="py-0">
                <CardHeader className="border-b px-5 py-4">
                    <CardTitle className="text-base">Activity</CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                    <ul>
                        {visibleActivities.map((activity, index) => (
                            <li key={`${activity.event}-${index}`} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                                <div className="flex flex-col items-center gap-1">
                                    <span className={`mt-1 size-2 shrink-0 rounded-full ${activityDots[index % activityDots.length]}`} />
                                    {index < visibleActivities.length - 1 && (
                                        <span className="w-px flex-1 bg-border" />
                                    )}
                                </div>
                                <div className="min-w-0 pb-1">
                                    <p className="text-sm leading-tight">{activity.event}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">{activity.time}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
