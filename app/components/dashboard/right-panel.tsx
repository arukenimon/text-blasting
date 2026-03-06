"use client";

import { useState } from "react";
import { CalendarDays, Send, Users } from "lucide-react";
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

const ACTIVITY_DOTS = [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-violet-500",
    "bg-amber-500",
];

type RightPanelProps = {
    segments: SegmentItem[];
    activities: ActivityItem[];
};

export function RightPanel({ segments, activities }: RightPanelProps) {
    const defaultMsg =
        "Hey {{first_name}}, your early access starts now. Reply YES to claim your offer.";
    const [message, setMessage] = useState(defaultMsg);
    const remaining = MAX_CHARS - message.length;
    const isOverLimit = remaining < 0;

    return (
        <div className="space-y-4">
            {/* Quick Send */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <div className="flex size-7 items-center justify-center rounded-md bg-violet-100">
                            <Send className="size-3.5 text-violet-600" />
                        </div>
                        <CardTitle className="text-base">Quick Send</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <form className="space-y-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Audience Segment</label>
                            <Select defaultValue={segments[0]?.name}>
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {segments.map((s) => (
                                        <SelectItem key={s.name} value={s.name}>
                                            {s.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-medium text-muted-foreground">Message</label>
                                <span
                                    className={`text-[11px] tabular-nums ${isOverLimit
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
                                rows={4}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className={isOverLimit ? "border-destructive focus-visible:ring-destructive/30" : ""}
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button type="submit" className="flex-1" disabled={isOverLimit}>
                                <Send />
                                Queue Message
                            </Button>
                            <Button type="button" variant="outline" size="icon" aria-label="Schedule">
                                <CalendarDays />
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Audience Segments */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Audience Segments</CardTitle>
                        <Badge variant="secondary">{segments.length}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-2">
                    {segments.map((segment) => (
                        <div
                            key={segment.name}
                            className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                        >
                            <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-violet-100">
                                <Users className="size-3 text-violet-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="truncate text-sm font-medium">{segment.name}</p>
                                    <Badge variant="outline" className="shrink-0 text-[10px]">
                                        0 contacts
                                    </Badge>
                                </div>
                                <p className="mt-0.5 text-xs text-muted-foreground">{segment.description}</p>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul>
                        {activities.map((activity, index) => (
                            <li key={activity.event} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                                <div className="flex flex-col items-center gap-1">
                                    <span
                                        className={`mt-1 size-2 shrink-0 rounded-full ${ACTIVITY_DOTS[index % ACTIVITY_DOTS.length]
                                            }`}
                                    />
                                    {index < activities.length - 1 && (
                                        <span className="w-px flex-1 bg-border" />
                                    )}
                                </div>
                                <div className="min-w-0 pb-1">
                                    <p className="text-sm leading-tight">{activity.event}</p>
                                    <p className="mt-1 text-[11px] text-muted-foreground">{activity.time}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}