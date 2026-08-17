import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME, SITE_SHORT_NAME } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: SITE_NAME,
        short_name: SITE_SHORT_NAME,
        description: SITE_DESCRIPTION,
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#f8fafc",
        theme_color: "#020617",
        categories: ["business", "productivity"],
        icons: [
            {
                src: "/icon.svg",
                sizes: "any",
                type: "image/svg+xml",
                purpose: "any",
            },
        ],
    };
}
