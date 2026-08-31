export const SITE_NAME = "Relay Campaigns";
export const SITE_SHORT_NAME = "Relay";
export const DEFAULT_SITE_URL = "https://relaycampaigns.vercel.app";
export const SITE_TITLE = "Free SMS Campaign Manager for Android | Relay Campaigns";
export const SITE_DESCRIPTION =
    "Create, schedule, and track SMS campaigns for free using your Android phone and SMS Gate. Import contacts, use templates, and monitor delivery.";

function normalizeSiteUrl(value: string | undefined) {
    const candidate = value?.trim() || DEFAULT_SITE_URL;

    try {
        const url = new URL(candidate);
        if (url.protocol !== "http:" && url.protocol !== "https:") {
            return DEFAULT_SITE_URL;
        }
        return url.origin;
    } catch {
        return DEFAULT_SITE_URL;
    }
}

export const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
