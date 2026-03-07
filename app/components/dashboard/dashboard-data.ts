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

export type CampaignItem = {
    id: string;
    name: string;
    audience: string;
    template: string;
    sent: number;
    delivered: number;
    replies: number;
    optOuts: number;
    status: CampaignStatus;
    scheduledAt: string;
    createdAt: string;
};

export type CampaignItem_ = {
    id: string;
    campaign_name: string;
    segment_id: string;
    segments: SegmentItem;
    templates: TemplateItem_;
    template_id: string;
    scheduled_date: string;
    created_at: string;
    updated_at: string;
};

export type SegmentItem = {
    id: string;
    name: string;
    //count: number;
    contacts?: { count: number }[]; // Include count of related contacts
    description: string;
    //lastCampaign: string;
    createdAt: string;
    //growth: string;
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

export type TemplateItem = {
    id: string;
    name: string;
    category: TemplateCategory;
    status: TemplateStatus;
    body: string;
    variables: string[];
    usedIn: number;
    lastUsed: string;
    createdAt: string;
};

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
    { name: "Inbox", href: "/admin/inbox", badge: "12" },
    { name: "Reports", href: "/admin/reports" },
    { name: "Settings", href: "/admin/settings" },
];

export const statItems: StatItem[] = [
    { label: "Messages Sent", value: "84,210", trend: "+12.4%", positive: true, accentColor: "border-violet-500" },
    { label: "Delivery Rate", value: "97.8%", trend: "+0.8%", positive: true, accentColor: "border-emerald-500" },
    { label: "Reply Rate", value: "18.2%", trend: "+3.2%", positive: true, accentColor: "border-sky-500" },
    { label: "Opt-out Rate", value: "1.4%", trend: "-0.3%", positive: true, accentColor: "border-amber-500" },
];

export const campaignItems: CampaignItem[] = [
    {
        id: "c1",
        name: "Spring Promo Wave 1",
        audience: "Loyal Customers",
        template: "Seasonal Offer",
        sent: 22000,
        delivered: 21640,
        replies: 3980,
        optOuts: 84,
        status: "Completed",
        scheduledAt: "Feb 28, 2026 9:00 AM",
        createdAt: "Feb 25, 2026",
    }
];

export const segmentItems: SegmentItem[] = [
    {
        id: "s1",
        name: "Loyal Customers",
        //count: 32140,
        description: "High purchase frequency in last 90 days",
        //lastCampaign: "Spring Promo Wave 1",
        createdAt: "Jan 10, 2026",
        //growth: "+842 this week",
        color_hex: "#8b5cf6",
    },
    {
        id: "s2",
        name: "Dormant Users",
        //count: 12093,
        description: "No activity for 60+ days",
        //lastCampaign: "Re-engagement Nurture",
        createdAt: "Dec 5, 2025",
        //growth: "-210 this week",
        color_hex: "#f59e0b",
    },
    {
        id: "s3",
        name: "New Signups",
        //count: 4298,
        description: "Signed up within last 14 days",
        //lastCampaign: "New Lead Welcome",
        createdAt: "Feb 1, 2026",
        //growth: "+614 this week",
        color_hex: "#0ea5e9",
    },
    {
        id: "s4",
        name: "VIP Segment",
        //count: 1840,
        description: "Top 5% by lifetime value",
        //lastCampaign: "VIP Early Access",
        createdAt: "Nov 20, 2025",
        //growth: "+28 this week",
        color_hex: "#10b981",
    },
    {
        id: "s5",
        name: "All Subscribers",
        //count: 58200,
        description: "Every opted-in contact",
        //lastCampaign: "Flash Sale Alert",
        createdAt: "Jan 1, 2026",
        //growth: "+1,274 this week",
        color_hex: "#3b82f6",
    },
    {
        id: "s6",
        name: "Cart Abandoners",
        // count: 7430,
        description: "Added to cart, did not purchase",
        //lastCampaign: "Abandoned Cart Recovery",
        createdAt: "Feb 10, 2026",
        //growth: "+330 this week",
        color_hex: "#ef4444",
    },
];

// export const contactItems: ContactItem[] = [
//     { id: "u1", name: "Alice Johnson", phone: "+1 (555) 210-4400", segment: "Loyal Customers", status: "Subscribed", lastMessaged: "Feb 28, 2026", joinedAt: "Jan 12, 2026", tags: ["VIP", "High LTV"] },
//     { id: "u2", name: "Marcus Lee", phone: "+1 (555) 384-9921", segment: "Dormant Users", status: "Subscribed", lastMessaged: "Dec 10, 2025", joinedAt: "Aug 4, 2025", tags: ["Win-back"] },
//     { id: "u3", name: "Sofia Reyes", phone: "+1 (555) 470-3312", segment: "New Signups", status: "Subscribed", lastMessaged: "Mar 2, 2026", joinedAt: "Feb 28, 2026", tags: [] },
//     { id: "u4", name: "David Okafor", phone: "+1 (555) 601-8874", segment: "VIP Segment", status: "Subscribed", lastMessaged: "Feb 20, 2026", joinedAt: "Oct 5, 2025", tags: ["VIP"] },
//     { id: "u5", name: "Emily Chow", phone: "+1 (555) 729-5563", segment: "Cart Abandoners", status: "Subscribed", lastMessaged: "Mar 1, 2026", joinedAt: "Dec 18, 2025", tags: ["Retarget"] },
//     { id: "u6", name: "James Torres", phone: "+1 (555) 812-3347", segment: "Loyal Customers", status: "Opted Out", lastMessaged: "Feb 15, 2026", joinedAt: "Sep 3, 2025", tags: [] },
//     { id: "u7", name: "Priya Patel", phone: "+1 (555) 944-2201", segment: "All Subscribers", status: "Subscribed", lastMessaged: "Mar 2, 2026", joinedAt: "Feb 22, 2026", tags: ["New"] },
//     { id: "u8", name: "Kevin Smith", phone: "+1 (555) 103-6680", segment: "Dormant Users", status: "Undeliverable", lastMessaged: "Nov 30, 2025", joinedAt: "Jul 14, 2025", tags: [] },
//     { id: "u9", name: "Rachel Kim", phone: "+1 (555) 267-4459", segment: "New Signups", status: "Subscribed", lastMessaged: "Mar 2, 2026", joinedAt: "Mar 1, 2026", tags: ["New"] },
//     { id: "u10", name: "Omar Hassan", phone: "+1 (555) 398-7712", segment: "VIP Segment", status: "Subscribed", lastMessaged: "Feb 28, 2026", joinedAt: "Nov 8, 2025", tags: ["VIP", "High LTV"] },
//     { id: "u11", name: "Laura Nguyen", phone: "+1 (555) 524-9030", segment: "All Subscribers", status: "Opted Out", lastMessaged: "Jan 20, 2026", joinedAt: "Oct 21, 2025", tags: [] },
//     { id: "u12", name: "Ben Adeyemi", phone: "+1 (555) 635-1184", segment: "Loyal Customers", status: "Subscribed", lastMessaged: "Feb 28, 2026", joinedAt: "Jan 30, 2026", tags: ["High LTV"] },
//     { id: "u13", name: "Chloe Martin", phone: "+1 (555) 741-5530", segment: "Cart Abandoners", status: "Subscribed", lastMessaged: "Mar 1, 2026", joinedAt: "Feb 5, 2026", tags: ["Retarget"] },
//     { id: "u14", name: "Tyler Brooks", phone: "+1 (555) 856-8843", segment: "Dormant Users", status: "Subscribed", lastMessaged: "Oct 5, 2025", joinedAt: "Jun 19, 2025", tags: ["Win-back"] },
//     { id: "u15", name: "Nina Vasquez", phone: "+1 (555) 920-3377", segment: "New Signups", status: "Subscribed", lastMessaged: "Mar 2, 2026", joinedAt: "Feb 27, 2026", tags: ["New"] },
// ];
export const templateItems: TemplateItem[] = [
    {
        id: "t1",
        name: "Seasonal Offer",
        category: "Promotional",
        status: "Approved",
        body: "Hey {{first_name}}! 🌸 Spring is here and so are your exclusive deals. Use code {{promo_code}} for {{discount}}% off now through {{expiry_date}}. Shop → {{link}} Reply STOP to opt out.",
        variables: ["{{first_name}}", "{{promo_code}}", "{{discount}}", "{{expiry_date}}", "{{link}}"],
        usedIn: 3,
        lastUsed: "Feb 28, 2026",
        createdAt: "Jan 5, 2026",
    },
    {
        id: "t2",
        name: "Win-Back",
        category: "Re-engagement",
        status: "Approved",
        body: "Hi {{first_name}}, we miss you! It's been a while since your last visit. Come back and enjoy {{discount}}% off your next order — no strings attached. {{link}} \n\nReply STOP to unsubscribe.",
        variables: ["{{first_name}}", "{{discount}}", "{{link}}"],
        usedIn: 1,
        lastUsed: "Feb 25, 2026",
        createdAt: "Dec 10, 2025",
    },
    {
        id: "t3",
        name: "Welcome Series",
        category: "Welcome",
        status: "Approved",
        body: "Welcome, {{first_name}}! 👋 Thanks for joining {{brand_name}}. Your account is ready and here's a gift: {{promo_code}} for {{discount}}% off your first order. Start exploring → {{link}}",
        variables: ["{{first_name}}", "{{brand_name}}", "{{promo_code}}", "{{discount}}", "{{link}}"],
        usedIn: 1,
        lastUsed: "Mar 2, 2026",
        createdAt: "Feb 1, 2026",
    },
    {
        id: "t4",
        name: "VIP Exclusive",
        category: "Promotional",
        status: "Approved",
        body: "{{first_name}}, as one of our VIP members you get early access to {{event_name}} — exclusively before anyone else. Claim your spot: {{link}} \n\nReply STOP to opt out.",
        variables: ["{{first_name}}", "{{event_name}}", "{{link}}"],
        usedIn: 1,
        lastUsed: "Feb 20, 2026",
        createdAt: "Nov 18, 2025",
    },
    {
        id: "t5",
        name: "Flash Sale",
        category: "Promotional",
        status: "Pending",
        body: "⚡ FLASH SALE — {{discount}}% OFF everything for the next {{hours}} hours only! No code needed. Shop now: {{link}} \n\nReply STOP to unsubscribe.",
        variables: ["{{discount}}", "{{hours}}", "{{link}}"],
        usedIn: 0,
        lastUsed: "—",
        createdAt: "Mar 2, 2026",
    },
    {
        id: "t6",
        name: "Cart Recovery",
        category: "Transactional",
        status: "Approved",
        body: "Hey {{first_name}}, you left {{item_count}} item(s) in your cart! Complete your order before they sell out. {{link}} \n\nReply STOP to opt out.",
        variables: ["{{first_name}}", "{{item_count}}", "{{link}}"],
        usedIn: 1,
        lastUsed: "Mar 1, 2026",
        createdAt: "Feb 10, 2026",
    },
    {
        id: "t7",
        name: "Loyalty Reward",
        category: "Promotional",
        status: "Approved",
        body: "{{first_name}}, you've earned {{points}} loyalty points! Redeem them for exclusive rewards before {{expiry_date}}. View your rewards: {{link}} \n\nReply STOP to unsubscribe.",
        variables: ["{{first_name}}", "{{points}}", "{{expiry_date}}", "{{link}}"],
        usedIn: 0,
        lastUsed: "—",
        createdAt: "Mar 2, 2026",
    },
    {
        id: "t8",
        name: "Order Confirmation",
        category: "Transactional",
        status: "Approved",
        body: "Hi {{first_name}}, your order #{{order_id}} has been confirmed! Expected delivery: {{delivery_date}}. Track it here: {{link}}",
        variables: ["{{first_name}}", "{{order_id}}", "{{delivery_date}}", "{{link}}"],
        usedIn: 0,
        lastUsed: "—",
        createdAt: "Jan 20, 2026",
    },
    {
        id: "t9",
        name: "Shipping Update",
        category: "Transactional",
        status: "Approved",
        body: "Good news, {{first_name}}! Your order #{{order_id}} is on its way. Track your package: {{link}}",
        variables: ["{{first_name}}", "{{order_id}}", "{{link}}"],
        usedIn: 0,
        lastUsed: "—",
        createdAt: "Jan 20, 2026",
    },
    {
        id: "t10",
        name: "Low Stock Alert",
        category: "Alert",
        status: "Pending",
        body: "⚠️ Heads up, {{first_name}}! {{product_name}} in your wishlist is almost sold out — only {{quantity}} left. Grab it now: {{link}} \n\nReply STOP to opt out.",
        variables: ["{{first_name}}", "{{product_name}}", "{{quantity}}", "{{link}}"],
        usedIn: 0,
        lastUsed: "—",
        createdAt: "Feb 15, 2026",
    },
    {
        id: "t11",
        name: "Referral Invite",
        category: "Promotional",
        status: "Rejected",
        body: "{{first_name}}, share the love! Invite a friend with your code {{referral_code}} and you'll both get {{reward}}. Share: {{link}} \n\nReply STOP to unsubscribe.",
        variables: ["{{first_name}}", "{{referral_code}}", "{{reward}}", "{{link}}"],
        usedIn: 0,
        lastUsed: "—",
        createdAt: "Feb 20, 2026",
    },
];

export const activityItems: ActivityItem[] = [
    { event: "Campaign \"Re-engagement Nurture\" started", time: "5 mins ago" },
    { event: "2,413 replies synced into inbox", time: "22 mins ago" },
    { event: "Template \"Spring Offer\" approved", time: "1 hour ago" },
    { event: "Opt-out webhook delivered", time: "2 hours ago" },
];