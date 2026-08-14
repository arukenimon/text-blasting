import { NextResponse } from 'next/server'
import { GatewayNotConfiguredError, getGatewayClientForWorkspace } from '@/lib/sms-gateway'
import { requireWorkspaceRole } from '@/lib/workspaces/server'

export const runtime = 'nodejs'

/** Verifies that the cloud gateway has a recently active sender device. */
export async function POST() {
    let context
    try {
        context = await requireWorkspaceRole('member')
    } catch (err) {
        return NextResponse.json(
            { ok: false, error: err instanceof Error ? err.message : 'Not authorized' },
            { status: 403 }
        )
    }

    try {
        const { client } = await getGatewayClientForWorkspace(context.workspace.id)
        const result = await client.checkCloudDeviceHealth()
        return NextResponse.json(result)
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
