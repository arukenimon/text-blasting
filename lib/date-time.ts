export const APP_TIME_ZONE = 'Asia/Manila'

const MANILA_UTC_OFFSET = '+08:00'

export function parseManilaDateTimeLocal(value: string): Date {
    const trimmed = value.trim()
    const withSeconds = trimmed.length === 16 ? `${trimmed}:00` : trimmed
    const date = new Date(`${withSeconds}${MANILA_UTC_OFFSET}`)

    if (Number.isNaN(date.getTime())) {
        throw new Error('Invalid schedule time')
    }

    return date
}

export function formatManilaDateTimeLocal(value: string | Date): string {
    const date = typeof value === 'string' ? new Date(value) : value
    if (Number.isNaN(date.getTime())) return ''

    return new Intl.DateTimeFormat('sv-SE', {
        timeZone: APP_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(date).replace(' ', 'T')
}

export function formatManilaDateTime(value: string | Date): string {
    const date = typeof value === 'string' ? new Date(value) : value
    if (Number.isNaN(date.getTime())) return ''

    return new Intl.DateTimeFormat('en-US', {
        timeZone: APP_TIME_ZONE,
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    }).format(date)
}
