import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
const isLocal = process.env.NODE_ENV === "development";
export async function POST(request: NextRequest) {
    const body = await request.json();


    const sessionClient = await createClient();
    const { data: { user } } = await sessionClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    // Fetch credentials from DB scoped to the current user
    const adminClient = createAdminClient();
    const { data: profile, error: profileError } = await adminClient
        .from('profile')
        .select('local_server, cloud_server')
        .eq('id', user.id)
        .single();

    if (profileError || !profile) {
        return NextResponse.json({ error: 'Profile not found. Please save your SMS gateway credentials first.' }, { status: 400 });
    }

    // const username = isLocal ? process.env.LOCAL_API_USERNAME : process.env.SMS_GATEWAY_USERNAME;
    // const password = isLocal ? process.env.LOCAL_API_PASSWORD : process.env.SMS_GATEWAY_PASSWORD;

    const username = profile.cloud_server.username;
    const password = profile.cloud_server.password;
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
