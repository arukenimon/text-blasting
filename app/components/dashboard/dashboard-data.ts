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
    contact_ids?: string[] | null;
    segment_id: string | null;
    segments: SegmentItem | null;
    templates: TemplateItem_ | null;
    template_id: string | null;
    message_body?: string | null;
    scheduled_date: string | null;
    status?: CampaignStatus;
    started_at?: string | null;
    completed_at?: string | null;
    created_at: string;
    updated_at: string;
};

export type SegmentItem = {
    id: string;
    name: string;
    contacts?: { count?: number; phone_no?: string | number; full_name?: string | null }[];
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
    { name: "Overview", href: "/admin/dashboard" },
    { name: "Campaigns", href: "/admin/campaigns" },
    { name: "Audience", href: "/admin/audience" },
    { name: "Templates", href: "/admin/templates" },
    { name: "Reports", href: "/admin/reports" },
    { name: "Settings", href: "/admin/settings" },
];

export const statItems: StatItem[] = [
    { label: "Messages Sent", value: "0", trend: "0%", positive: true, accentColor: "border-violet-500" },
    { label: "Delivery Rate", value: "0%", trend: "0%", positive: true, accentColor: "border-emerald-500" },
    { label: "Failed Messages", value: "0", trend: "0%", positive: true, accentColor: "border-red-500" },
    { label: "Opt-out Rate", value: "0%", trend: "0%", positive: true, accentColor: "border-amber-500" },
];

export const activityItems: ActivityItem[] = [];
