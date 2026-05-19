import type {
    GatewayCredentials,
    SendMessageRequest,
    SendMessageResponse,
    WebhookEventType,
    WebhookRegistration,
} from './types'

const CLOUD_HOST = 'api.sms-gate.app'

export class SmsGatewayError extends Error {
    constructor(message: string, public status: number, public body?: unknown) {
        super(message)
        this.name = 'SmsGatewayError'
    }
}

/**
 * Single point of contact for the Android SMS Gateway.
 * Cloud and local-server endpoints differ in path prefix only:
 *   cloud → https://api.sms-gate.app/3rdparty/v1/{resource}
 *   local → http://{address}/{resource}
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
            // Cloud address is sometimes saved as "api.sms-gate.app:443" without scheme
            const url = host.startsWith('http') ? host : `https://${host}`
            return `${url.replace(/\/+$/, '')}/3rdparty/v1`
        }
        // Local: phone address must already be reachable from our server
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

        // 204 No Content (mostly from DELETE on local server)
        if (res.status === 204) return null

        const text = await res.text()
        let data: unknown = null
        if (text) {
            try { data = JSON.parse(text) } catch { data = text }
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

    // ── Messages ────────────────────────────────────────────────────────────
    sendMessage(req: SendMessageRequest): Promise<SendMessageResponse> {
        return this.request<SendMessageResponse>('POST', '/message', req) as Promise<SendMessageResponse>
    }

    // ── Webhooks ────────────────────────────────────────────────────────────
    listWebhooks(): Promise<WebhookRegistration[]> {
        return this.request<WebhookRegistration[]>('GET', '/webhooks') as Promise<WebhookRegistration[]>
    }

    registerWebhook(
        url: string,
        event: WebhookEventType,
        opts: { id?: string } = {}
    ): Promise<WebhookRegistration> {
        const body: Record<string, string> = { url, event }
        // Local server requires an explicit id; cloud accepts and uses it too.
        if (opts.id) body.id = opts.id
        return this.request<WebhookRegistration>('POST', '/webhooks', body) as Promise<WebhookRegistration>
    }

    async deleteWebhook(id: string): Promise<void> {
        await this.request<null>('DELETE', `/webhooks/${encodeURIComponent(id)}`)
    }

    /** List then delete every existing webhook. Returns count deleted. */
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

    /** Minimal connectivity check that doesn't require a real send. */
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
