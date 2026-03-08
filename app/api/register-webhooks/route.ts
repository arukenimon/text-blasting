import { NextRequest, NextResponse } from "next/server";

const isLocal = process.env.NODE_ENV === "development";

// Device local server only supports these 4 events
const EVENTS = isLocal ? ["sms:received", "sms:sent", "sms:delivered", "sms:failed"] as const :
    ["sms:received", "sms:sent", "sms:delivered", "sms:failed",
        "sms:data-received", "mms:received", "system:ping"] as const

export async function POST(request: NextRequest) {
    const username = isLocal ? process.env.LOCAL_API_USERNAME : process.env.SMS_GATEWAY_USERNAME;
    const password = isLocal ? process.env.LOCAL_API_PASSWORD : process.env.SMS_GATEWAY_PASSWORD;
    const auth = Buffer.from(`${username}:${password}`).toString("base64");
    const webhookUrl = process.env.WEBHOOK_URL!;

    // const apiUrl = `${process.env.LOCAL_SERVER_URL!}/webhooks`;
    const apiUrl = isLocal
        ? `${process.env.LOCAL_SERVER_URL!}/webhooks`
        : "https://api.sms-gate.app/3rdparty/v1/webhooks";


    // const apiUrl = `${process.env.LOCAL_SERVER_URL}/webhooks`;

    const responses: Record<string, unknown> = {};

    for (const event of EVENTS) {
        try {
            const body: Record<string, string> = { url: webhookUrl, event };
            // Local server requires a unique ID per webhook
            body.id = `webhook-${event.replace(":", "-")}`;

            const res = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Basic ${auth}`,
                },
                body: JSON.stringify(body),
            });
            responses[event] = await res.json();
        } catch (err: unknown) {
            responses[event] = { error: err instanceof Error ? err.message : "fetch failed" };
        }
        await new Promise((resolve) => setTimeout(resolve, 300));
    }

    console.log(`[register-webhooks] mode=device`, responses);

    const ids = Object.fromEntries(
        Object.entries(responses)
            .filter(([, v]) => (v as Record<string, unknown>)?.id)
            .map(([event, v]) => [event, (v as Record<string, unknown>).id])
    );

    const allSucceeded = EVENTS.every((e) => !(responses[e] as Record<string, unknown>)?.error);

    return NextResponse.json({ success: allSucceeded, ids, responses }, { status: allSucceeded ? 200 : 207 });
}