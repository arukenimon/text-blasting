import { createAdminClient, createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const isLocal = process.env.NODE_ENV === "development";

// Device local server only supports these 4 events
const EVENTS = isLocal ? ["sms:received", "sms:sent", "sms:delivered", "sms:failed"] as const :
    ["sms:received", "sms:sent", "sms:delivered", "sms:failed",
        "sms:data-received", "mms:received", "system:ping"] as const

export async function POST(request: NextRequest) {

    // Get the authenticated user's ID from their session
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

    const { local_server, cloud_server } = profile;

    //console.log(`[register-webhooks] Received request:`, req);

    //return NextResponse.json({ success: true, message: "Webhook registration endpoint is not implemented yet." }, { status: 200 });
    // const username = isLocal ? local_server.username : cloud_server.username;
    // const password = isLocal ? local_server.password : cloud_server.password;
    const username = cloud_server.username;
    const password = cloud_server.password;
    const auth = Buffer.from(`${username}:${password}`).toString("base64");
    const webhookUrl = process.env.WEBHOOK_URL!;

    // const apiUrl = `${process.env.LOCAL_SERVER_URL!}/webhooks`;
    // const apiUrl = isLocal
    //     ? `http://${local_server.public_address}/webhooks`
    //     : `https://${cloud_server.server_address}/3rdparty/v1/webhooks`;

    const apiUrl = `https://${cloud_server.server_address}/3rdparty/v1/webhooks`;

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