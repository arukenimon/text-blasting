import { NextRequest, NextResponse } from "next/server";

const isLocal = process.env.NODE_ENV === "development";

const LOCAL_EVENTS = ["sms:received", "sms:sent", "sms:delivered", "sms:failed"] as const;

export async function POST(request: NextRequest) {
    const username = process.env.SMS_GATEWAY_USERNAME!;
    const password = process.env.SMS_GATEWAY_PASSWORD!;
    const auth = Buffer.from(`${username}:${password}`).toString("base64");

    const responses: Record<string, unknown> = {};

    if (isLocal) {
        // Local: IDs are derived from event names (matches what register-webhooks sets)
        const localServerUrl = process.env.LOCAL_SERVER_URL ?? "http://192.168.1.40:8080";

        for (const event of LOCAL_EVENTS) {
            const id = `webhook-${event.replace(":", "-")}`;
            try {
                const res = await fetch(`${localServerUrl}/webhooks/${id}`, {
                    method: "DELETE",
                    headers: { "Authorization": `Basic ${auth}` },
                });
                responses[id] = res.status === 204 ? { success: true } : await res.json();
            } catch (err: unknown) {
                responses[id] = { error: err instanceof Error ? err.message : "fetch failed" };
            }
            await new Promise((resolve) => setTimeout(resolve, 300));
        }
    } else {
        // Cloud: fetch the registered webhooks list first, then delete each one
        try {
            const listRes = await fetch("https://api.sms-gate.app/3rdparty/v1/webhooks", {
                headers: { "Authorization": `Basic ${auth}` },
            });
            const webhooks: { id: string }[] = await listRes.json();

            for (const { id } of webhooks) {
                try {
                    const res = await fetch(`https://api.sms-gate.app/3rdparty/v1/webhooks/${id}`, {
                        method: "DELETE",
                        headers: { "Authorization": `Basic ${auth}` },
                    });
                    responses[id] = res.status === 204 ? { success: true } : await res.json();
                } catch (err: unknown) {
                    responses[id] = { error: err instanceof Error ? err.message : "fetch failed" };
                }
                await new Promise((resolve) => setTimeout(resolve, 300));
            }
        } catch (err: unknown) {
            return NextResponse.json(
                { error: err instanceof Error ? err.message : "failed to list webhooks" },
                { status: 500 }
            );
        }
    }

    console.log(`[delete-webhooks] mode=${isLocal ? "local" : "cloud"}`, responses);

    const allSucceeded = Object.values(responses).every((v) => !(v as Record<string, unknown>)?.error);

    return NextResponse.json(
        { success: allSucceeded, mode: isLocal ? "local" : "cloud", responses },
        { status: allSucceeded ? 200 : 207 }
    );
}