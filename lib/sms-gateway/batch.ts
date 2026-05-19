import type { GatewayMode } from './types'

const CHUNK_SIZE: Record<GatewayMode, number> = {
    cloud: 50,
    local: 20,
}

export function chunkPhoneNumbers<T>(items: T[], mode: GatewayMode): T[][] {
    const size = CHUNK_SIZE[mode] ?? 20
    const out: T[][] = []
    for (let i = 0; i < items.length; i += size) {
        out.push(items.slice(i, i + size))
    }
    return out
}

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
