import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/server";

function verifySignature(secretKey: string, payload: string, timestamp: string, signature: string) {
    const message = payload + timestamp;
    const expectedSignature = crypto
        .createHmac('sha256', secretKey)
        .update(message)
        .digest('hex');
    const sig = String(signature).trim().toLowerCase();
    if (sig.length !== expectedSignature.length) return false;
    return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(sig, 'hex')
    );
}

export async function POST(request: NextRequest) {
    const rawBody = await request.text();

    const bodyJson = JSON.parse(rawBody);


    const signature = request.headers.get('x-signature') ?? '';
    const timestamp = request.headers.get('x-timestamp') ?? '';
    const secretKey = process.env.WEBHOOK_SECRET ?? '';

    // Reject requests with timestamps outside ±5 minutes (replay attack prevention)
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (Math.abs(nowSeconds - Number(timestamp)) > 300) {
        console.warn("[webhook] Timestamp expired:", { timestamp, nowSeconds });
        return NextResponse.json({ error: 'Timestamp expired' }, { status: 401 });
    }

    if (!verifySignature(secretKey, rawBody, timestamp, signature)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const { event, payload } = JSON.parse(rawBody);


    const supabase = createAdminClient()
    switch (event) {
        case 'sms:received':
            console.log(`[webhook] SMS received:`, payload);
            // await supabase.from('messages')
            //     .insert({

            //     })
            // payload: { messageId, message, sender, recipient, simNumber, receivedAt }
            break;
        case 'sms:data-received':
            console.log(`[webhook] SMS data received:`, payload);
            // payload: { messageId, data (base64), sender, recipient, simNumber, receivedAt }
            break;
        case 'mms:received':
            console.log(`[webhook] MMS received:`, payload);
            // payload: { messageId, transactionId, subject, size, sender, recipient, simNumber, receivedAt }
            break;
        case 'sms:sent':
            console.log(`[webhook] SMS sent:`, payload);
            // payload: { messageId, sender, recipient, simNumber, partsCount, sentAt }
            break;
        case 'sms:delivered':
            console.log(`[webhook] SMS delivered:`, payload);
            // payload: { messageId, sender, recipient, simNumber, deliveredAt }
            break;
        case 'sms:failed':
            console.log(`[webhook] SMS failed:`, payload);
            // payload: { messageId, sender, recipient, simNumber, reason, failedAt }
            break;
        case 'system:ping':
            console.log(`[webhook] System ping:`, payload);
            // payload: { health }
            break;
        default:
            console.warn(`Unhandled webhook event: ${event}`);
    }

    return NextResponse.json({ success: true });
}
