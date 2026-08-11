import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { GatewayNotConfiguredError, getGatewayClientForWorkspace } from '@/lib/sms-gateway'
import { requireWorkspaceRole } from '@/lib/workspaces/server'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST() {
    let context
    try {
        context = await requireWorkspaceRole('admin')
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Not authorized' },
            { status: 403 }
        )
    }

    let gateway
    try {
        ({ client: gateway } = await getGatewayClientForWorkspace(context.workspace.id))
    } catch (err) {
        if (err instanceof GatewayNotConfiguredError) {
            return NextResponse.json({ error: err.message }, { status: 400 })
        }
        throw err
    }

    const deleted = await gateway.clearAllWebhooks().catch(() => 0)

    const admin = createAdminClient()
    await admin
        .from('workspace_sms_gateway')
        .update({ webhook_registrations: {} })
        .eq('workspace_id', context.workspace.id)

    return NextResponse.json({ success: true, deleted })
}
