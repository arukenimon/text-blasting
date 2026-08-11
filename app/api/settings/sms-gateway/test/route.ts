import { NextResponse } from 'next/server'
import { GatewayNotConfiguredError, getGatewayClientForWorkspace } from '@/lib/sms-gateway'
import { requireWorkspaceRole } from '@/lib/workspaces/server'

export const runtime = 'nodejs'

/** Verifies that the saved credentials can reach the gateway. */
export async function POST() {
    let context
    try {
        context = await requireWorkspaceRole('admin')
    } catch (err) {
        return NextResponse.json(
            { ok: false, error: err instanceof Error ? err.message : 'Not authorized' },
            { status: 403 }
        )
    }

    try {
        const { client, profile } = await getGatewayClientForWorkspace(context.workspace.id)
        const result = await client.ping()
        return NextResponse.json({ mode: profile.mode, ...result })
    } catch (err) {
        if (err instanceof GatewayNotConfiguredError) {
            return NextResponse.json({ ok: false, error: err.message }, { status: 400 })
        }
        return NextResponse.json(
            { ok: false, error: err instanceof Error ? err.message : 'unknown' },
            { status: 500 }
        )
    }
}
