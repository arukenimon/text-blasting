export const SITE_NAME = "Relay Campaigns";
export const SITE_SHORT_NAME = "Relay";
export const DEFAULT_SITE_URL = "https://relaycampaigns.vercel.app";
export const SITE_DESCRIPTION =
    "Plan, schedule, and track team SMS campaigns with contacts, segments, templates, and delivery reporting powered by SMS Gate.";

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
