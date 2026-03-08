import { createAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const isLocal = process.env.NODE_ENV === "development";
export async function POST(request: NextRequest) {
    const body = await request.json();

    const username = isLocal ? process.env.LOCAL_API_USERNAME : process.env.SMS_GATEWAY_USERNAME;
    const password = isLocal ? process.env.LOCAL_API_PASSWORD : process.env.SMS_GATEWAY_PASSWORD;
    const auth = Buffer.from(`${username}:${password}`).toString("base64");

    const response = await fetch("https://api.sms-gate.app/3rdparty/v1/message", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Basic ${auth}`,
        },
        body: JSON.stringify(body),
    });

    const supabase = createAdminClient()
    const data = await response.json();

    if (!response.ok) {
        return NextResponse.json({ error: data.error || "Failed to send SMS" }, { status: response.status });
    }

    return NextResponse.json(data, { status: response.status });
}
