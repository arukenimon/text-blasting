import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

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

    console.log("[webhook] Request received:", {
        url: request.url,
        signature: request.headers.get('x-signature'),
        timestamp: request.headers.get('x-timestamp'),
        body: rawBody,
    });

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

    console.log(`Webhook received [${event}]:`, payload);

    switch (event) {
        case 'sms:received':
            // payload: { messageId, message, sender, recipient, simNumber, receivedAt }
            break;
        case 'sms:data-received':
            // payload: { messageId, data (base64), sender, recipient, simNumber, receivedAt }
            break;
        case 'mms:received':
            // payload: { messageId, transactionId, subject, size, sender, recipient, simNumber, receivedAt }
            break;
        case 'sms:sent':
            // payload: { messageId, sender, recipient, simNumber, partsCount, sentAt }
            break;
        case 'sms:delivered':
            // payload: { messageId, sender, recipient, simNumber, deliveredAt }
            break;
        case 'sms:failed':
            // payload: { messageId, sender, recipient, simNumber, reason, failedAt }
            break;
        case 'system:ping':
            // payload: { health }
            break;
        default:
            console.warn(`Unhandled webhook event: ${event}`);
    }

    return NextResponse.json({ success: true });
}
