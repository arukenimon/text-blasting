import { NextResponse } from 'next/server'
import { GatewayNotConfiguredError, getGatewayClientForWorkspace } from '@/lib/sms-gateway'
import { requireWorkspaceRole } from '@/lib/workspaces/server'

export const runtime = 'nodejs'

export async function GET() {
    let context
    try {
        context = await requireWorkspaceRole('admin')
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Not authorized' },
            { status: 403 }
        )
    }

    try {
        const { client, profile } = await getGatewayClientForWorkspace(context.workspace.id)
        const webhooks = await client.listWebhooks()
        return NextResponse.json({ mode: profile.mode, webhooks })
    } catch (err) {
        if (err instanceof GatewayNotConfiguredError) {
            return NextResponse.json({ error: err.message }, { status: 400 })
        }
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'fetch failed' },
            { status: 500 }
        )
    }
}
