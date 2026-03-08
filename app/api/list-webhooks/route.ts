import { NextResponse } from "next/server";

const isLocal = process.env.NODE_ENV === "development";

export async function GET() {
    const username = isLocal ? process.env.LOCAL_API_USERNAME : process.env.SMS_GATEWAY_USERNAME;
    const password = isLocal ? process.env.LOCAL_API_PASSWORD : process.env.SMS_GATEWAY_PASSWORD;
    const auth = Buffer.from(`${username}:${password}`).toString("base64");

    const apiUrl = isLocal
        ? `${process.env.LOCAL_SERVER_URL ?? "http://192.168.1.40:8080"}/webhooks`
        : "https://api.sms-gate.app/3rdparty/v1/webhooks";

    try {
        const res = await fetch(apiUrl, {
            headers: { "Authorization": `Basic ${auth}` },
        });

        const data = await res.json();
        return NextResponse.json({ mode: isLocal ? "local" : "cloud", webhooks: data }, { status: res.status });
    } catch (err: unknown) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "fetch failed" },
            { status: 500 }
        );
    }
}
