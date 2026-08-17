import { ImageResponse } from "next/og";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export const alt = "Relay Campaigns — SMS campaign management powered by SMS Gate";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
    return new ImageResponse(
        (
            <div
                style={{
                    alignItems: "center",
                    background: "linear-gradient(135deg, #020617 0%, #0f172a 58%, #064e3b 100%)",
                    color: "white",
                    display: "flex",
                    height: "100%",
                    justifyContent: "center",
                    padding: "64px 76px",
                    width: "100%",
                }}
            >
                <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                    <div style={{ alignItems: "center", display: "flex", gap: 22 }}>
                        <div
                            style={{
                                alignItems: "center",
                                background: "#6ee7b7",
                                borderRadius: 22,
                                color: "#020617",
                                display: "flex",
                                fontSize: 34,
                                fontWeight: 900,
                                height: 86,
                                justifyContent: "center",
                                width: 86,
                            }}
                        >
                            RC
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <div style={{ color: "#a7f3d0", fontSize: 20, letterSpacing: 5, textTransform: "uppercase" }}>
                                SMS operations
                            </div>
                            <div style={{ fontSize: 40, fontWeight: 700 }}>{SITE_NAME}</div>
                        </div>
                    </div>
                    <div style={{ fontSize: 68, fontWeight: 700, letterSpacing: -3, lineHeight: 1.05, marginTop: 70, maxWidth: 1000 }}>
                        Send the right text. Track every delivery.
                    </div>
                    <div style={{ color: "#cbd5e1", fontSize: 27, lineHeight: 1.45, marginTop: 30, maxWidth: 980 }}>
                        {SITE_DESCRIPTION}
                    </div>
                    <div style={{ color: "#6ee7b7", fontSize: 23, marginTop: 52 }}>
                        relaycampaigns.vercel.app
                    </div>
                </div>
            </div>
        ),
        size,
    );
}
