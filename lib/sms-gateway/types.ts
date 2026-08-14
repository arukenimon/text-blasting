export type GatewayMode = 'cloud' | 'local'

export type GatewayCredentials = {
    mode: GatewayMode
    /** Cloud: api.sms-gate.app[:port]. Local: public_address (host[:port]) reachable from our server. */
    address: string
    username: string
    password: string
}

export type GatewayDevice = {
    id: string
    name?: string
    lastSeen?: string
    lastSeenAt?: string
    last_seen?: string
    last_seen_at?: string
    updatedAt?: string
    [key: string]: unknown
}

export type GatewayHealthResult = {
    ok: boolean
    mode: GatewayMode
    checked: 'cloud-devices'
    error?: string
    status?: number
    deviceCount?: number
    activeDeviceCount?: number
    lastSeen?: string
    stale?: boolean
    activeWithinMinutes?: number
    activeWithinHours?: number
}

export type SendMessageRequest = {
    textMessage: { text: string }
    phoneNumbers: string[]
    simNumber?: number
    /** Optional client-supplied id; rarely needed. */
    id?: string
}

export type SendMessageOptions = {
    deviceActiveWithinHours?: number
}

/** What the gateway returns from POST /message */
export type SendMessageResponse = {
    id: string
    state?: 'Pending' | 'Processed' | 'Sent' | 'Delivered' | 'Failed'
    recipients?: { phoneNumber: string; state: string; error?: string }[]
}

export type WebhookEventType =
    | 'sms:received'
    | 'sms:sent'
    | 'sms:delivered'
    | 'sms:failed'
    | 'sms:data-received'
    | 'mms:received'
    | 'mms:downloaded'
    | 'system:ping'

export type WebhookRegistration = {
    id: string
    url: string
    event: WebhookEventType
}

/** Discriminated union of webhook payloads we care about. */
export type WebhookEvent =
    | { event: 'sms:sent';        payload: { messageId: string; sender?: string; recipient?: string; simNumber?: number; partsCount?: number; sentAt: string } }
    | { event: 'sms:delivered';   payload: { messageId: string; sender?: string; recipient?: string; simNumber?: number; deliveredAt: string } }
    | { event: 'sms:failed';      payload: { messageId: string; sender?: string; recipient?: string; simNumber?: number; reason: string; failedAt: string } }
    | { event: 'sms:received';    payload: { messageId?: string; message: string; sender: string; recipient?: string; simNumber?: number; receivedAt: string } }
    | { event: 'sms:data-received'; payload: { messageId?: string; data: string; sender: string; recipient?: string; simNumber?: number; receivedAt: string } }
    | { event: 'mms:received';    payload: { messageId?: string; transactionId?: string; subject?: string; size?: number; sender: string; recipient?: string; simNumber?: number; receivedAt: string } }
    | { event: 'mms:downloaded';  payload: { messageId?: string; transactionId?: string; subject?: string; sender: string; recipient?: string; simNumber?: number; receivedAt: string } }
    | { event: 'system:ping';     payload: { health?: unknown } }
