export type NavItem = {
    name: string;
    href: string;
    badge?: string;
};

export type StatItem = {
    label: string;
    value: string;
    trend: string;
    positive: boolean;
    accentColor: string;
};

export type CampaignStatus = "Draft" | "Scheduled" | "Running" | "Completed" | "Paused";

export type CampaignItem_ = {
    // campaigns.id is bigint in the existing schema → number on the client.
    id: number;
    campaign_name: string;
    segment_id: string;
    segments: SegmentItem;
    templates: TemplateItem_;
    template_id: string;
    scheduled_date: string;
    status?: CampaignStatus;
    started_at?: string | null;
    completed_at?: string | null;
    created_at: string;
    updated_at: string;
};

export type SegmentItem = {
    id: string;
    name: string;
    contacts?: { count: number; phone_no: number; full_name: string }[];
    description: string;
    createdAt: string;
    color_hex: string;
};

export type ContactStatus = "Subscribed" | "Opted Out" | "Undeliverable";

export type ContactItem = {
    created_at: string;
    id: string;
    full_name: string;
    phone_no: string;
    segment_id: string;
    status: string;
    updated_at: string;
    segment?: SegmentItem;
};

export type ActivityItem = {
    event: string;
    time: string;
};

export type TemplateCategory = "Promotional" | "Transactional" | "Re-engagement" | "Welcome" | "Alert";
export type TemplateStatus = "Approved" | "Pending" | "Rejected";

export type TemplateItem_ = {
    id: string;
    template_name: string;
    body: string;
    category: TemplateCategory;
    created_at: string;
    updated_at: string;
};

export const navItems: NavItem[] = [
    { name: "Overview", href: "/admin" },
    { name: "Campaigns", href: "/admin/campaigns" },
    { name: "Audience", href: "/admin/audience" },
    { name: "Templates", href: "/admin/templates" },
    { name: "Inbox", href: "#" },
    { name: "Reports", href: "#" },
    { name: "Settings", href: "/admin/settings" },
];

export const statItems: StatItem[] = [
    { label: "Messages Sent", value: "0", trend: "0%", positive: true, accentColor: "border-violet-500" },
    { label: "Delivery Rate", value: "0%", trend: "0%", positive: true, accentColor: "border-emerald-500" },
    { label: "Reply Rate", value: "0%", trend: "0%", positive: true, accentColor: "border-sky-500" },
    { label: "Opt-out Rate", value: "0%", trend: "0%", positive: true, accentColor: "border-amber-500" },
];

export const activityItems: ActivityItem[] = [];
