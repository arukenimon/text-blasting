import type {
    GatewayCredentials,
    GatewayDevice,
    GatewayHealthResult,
    SendMessageOptions,
    SendMessageRequest,
    SendMessageResponse,
    WebhookEventType,
    WebhookRegistration,
} from './types'

const CLOUD_HOST = 'api.sms-gate.app'
const DEFAULT_ACTIVE_WITHIN_HOURS = 12

export class SmsGatewayError extends Error {
    constructor(message: string, public status: number, public body?: unknown) {
        super(message)
        this.name = 'SmsGatewayError'
    }
}

function getDeviceLastSeenTimestamp(device: GatewayDevice): number | null {
    const candidates = [
        device.lastSeen,
        device.lastSeenAt,
        device.last_seen,
        device.last_seen_at,
        device.updatedAt,
        typeof device.updated_at === 'string' ? device.updated_at : undefined,
        typeof device.lastActivityAt === 'string' ? device.lastActivityAt : undefined,
    ]

    for (const value of candidates) {
        if (!value) continue
        const timestamp = Date.parse(value)
        if (Number.isFinite(timestamp)) return timestamp
    }

    return null
}

/**
 * Single point of contact for the Android SMS Gateway.
 * Cloud and local-server endpoints differ in path prefix only:
 *   cloud -> https://api.sms-gate.app/3rdparty/v1/{resource}
 *   local -> http://{address}/{resource}
 */
export class SmsGatewayClient {
    private readonly baseUrl: string
    private readonly authHeader: string

    constructor(private readonly creds: GatewayCredentials) {
        this.baseUrl = SmsGatewayClient.resolveBaseUrl(creds)
        this.authHeader =
            'Basic ' + Buffer.from(`${creds.username}:${creds.password}`).toString('base64')
    }

    static resolveBaseUrl(creds: GatewayCredentials): string {
        if (creds.mode === 'cloud') {
            const host = creds.address?.trim() || `${CLOUD_HOST}:443`
            // Cloud address is sometimes saved as "api.sms-gate.app:443" without scheme.
            const url = host.startsWith('http') ? host : `https://${host}`
            return `${url.replace(/\/+$/, '')}/3rdparty/v1`
        }
        const addr = creds.address?.trim() ?? ''
        if (!addr) throw new Error('Local mode requires a non-empty public address')
        const url = addr.startsWith('http') ? addr : `http://${addr}`
        return url.replace(/\/+$/, '')
    }

    private async request<T>(
        method: 'GET' | 'POST' | 'DELETE',
        path: string,
        body?: unknown
    ): Promise<T | null> {
        const res = await fetch(`${this.baseUrl}${path}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                Authorization: this.authHeader,
            },
            body: body !== undefined ? JSON.stringify(body) : undefined,
            cache: 'no-store',
        })

        if (res.status === 204) return null

        const text = await res.text()
        let data: unknown = null
        if (text) {
            try {
                data = JSON.parse(text)
            } catch {
                data = text
            }
        }

        if (!res.ok) {
            throw new SmsGatewayError(
                `Gateway ${method} ${path} failed (${res.status})`,
                res.status,
                data
            )
        }
        return data as T
    }

    sendMessage(req: SendMessageRequest, opts: SendMessageOptions = {}): Promise<SendMessageResponse> {
        const activeWithinHours = opts.deviceActiveWithinHours ?? DEFAULT_ACTIVE_WITHIN_HOURS
        const params = new URLSearchParams()
        if (this.creds.mode === 'cloud' && activeWithinHours > 0) {
            params.set('deviceActiveWithin', String(activeWithinHours))
        }
        const queryString = params.toString()
        const query = queryString ? `?${queryString}` : ''
        return this.request<SendMessageResponse>('POST', `/messages${query}`, req).catch((err) => {
            if (err instanceof SmsGatewayError && (err.status === 404 || err.status === 405)) {
                return this.request<SendMessageResponse>('POST', `/message${query}`, req)
            }
            throw err
        }) as Promise<SendMessageResponse>
    }

    listDevices(): Promise<GatewayDevice[]> {
        return this.request<GatewayDevice[]>('GET', '/devices') as Promise<GatewayDevice[]>
    }

    async checkCloudDeviceHealth(
        activeWithinHours = DEFAULT_ACTIVE_WITHIN_HOURS
    ): Promise<GatewayHealthResult> {
        const activeWithinMinutes = activeWithinHours * 60
        try {
            const devices = await this.listCloudDevices()
            const thresholdMs = activeWithinMinutes * 60 * 1000
            const now = Date.now()
            const seenAt = devices
                .map((device) => getDeviceLastSeenTimestamp(device))
                .filter((timestamp): timestamp is number => timestamp !== null)
                .sort((a, b) => b - a)
            const lastSeen = seenAt[0] ? new Date(seenAt[0]).toISOString() : undefined
            const activeDeviceCount = seenAt.filter((timestamp) => now - timestamp <= thresholdMs).length
            const stale = devices.length > 0 && activeDeviceCount === 0

            return {
                ok: activeDeviceCount > 0,
                mode: 'cloud',
                checked: 'cloud-devices',
                deviceCount: devices.length,
                activeDeviceCount,
                lastSeen,
                stale,
                activeWithinMinutes,
                activeWithinHours,
                error: devices.length === 0
                    ? 'No sender devices are registered in the SMS Gateway cloud account.'
                    : stale
                        ? `No sender device checked in within the last ${activeWithinHours} hours.`
                        : undefined,
            }
        } catch (err) {
            if (err instanceof SmsGatewayError) {
                return {
                    ok: false,
                    mode: 'cloud',
                    checked: 'cloud-devices',
                    status: err.status,
                    error: err.message,
                    activeWithinMinutes,
                    activeWithinHours,
                }
            }
            return {
                ok: false,
                mode: 'cloud',
                checked: 'cloud-devices',
                error: err instanceof Error ? err.message : 'unknown',
                activeWithinMinutes,
                activeWithinHours,
            }
        }
    }

    private async listCloudDevices(): Promise<GatewayDevice[]> {
        const listed = await this.listDevices().catch((err) => {
            if (err instanceof SmsGatewayError && err.status === 404) return [] as GatewayDevice[]
            throw err
        })
        if (listed.length > 0) return listed

        const current = await this.request<GatewayDevice | GatewayDevice[]>('GET', '/device').catch((err) => {
            if (err instanceof SmsGatewayError && err.status === 404) return null
            throw err
        })
        if (!current) return []
        return Array.isArray(current) ? current : [current]
    }

    listWebhooks(): Promise<WebhookRegistration[]> {
        return this.request<WebhookRegistration[]>('GET', '/webhooks') as Promise<WebhookRegistration[]>
    }

    registerWebhook(
        url: string,
        event: WebhookEventType,
        opts: { id?: string } = {}
    ): Promise<WebhookRegistration> {
        const body: Record<string, string> = { url, event }
        if (opts.id) body.id = opts.id
        return this.request<WebhookRegistration>('POST', '/webhooks', body) as Promise<WebhookRegistration>
    }

    async deleteWebhook(id: string): Promise<void> {
        await this.request<null>('DELETE', `/webhooks/${encodeURIComponent(id)}`)
    }

    async clearAllWebhooks(): Promise<number> {
        const existing = await this.listWebhooks().catch(() => [] as WebhookRegistration[])
        let count = 0
        for (const w of existing ?? []) {
            try {
                await this.deleteWebhook(w.id)
                count++
            } catch {
                // Continue; a single failure shouldn't block the rest.
            }
        }
        return count
    }

    async ping(): Promise<{ ok: true } | { ok: false; error: string; status?: number }> {
        try {
            await this.listWebhooks()
            return { ok: true }
        } catch (err) {
            if (err instanceof SmsGatewayError) {
                return { ok: false, status: err.status, error: err.message }
            }
            return { ok: false, error: err instanceof Error ? err.message : 'unknown' }
        }
    }
}
