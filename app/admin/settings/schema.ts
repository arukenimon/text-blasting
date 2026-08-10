import * as z from 'zod'

export const ProfileSchema = z.object({
    display_name: z
        .string()
        .min(2, { error: 'Name must be at least 2 characters.' })
        .trim(),
})

export const PasswordSchema = z.object({
    password: z
        .string()
        .min(8, { error: 'Password must be at least 8 characters.' }),
    confirm_password: z.string(),
})

export const NotificationsSchema = z.object({
    campaign_completed: z.boolean(),
    new_reply: z.boolean(),
    optout_threshold: z.boolean(),
    delivery_errors: z.boolean(),
})

export const SmsGatewaySchema = z
    .object({
        mode: z.enum(['local', 'cloud'], { error: 'Gateway mode must be local or cloud.' }),
        local_address: z.string().trim().optional(),
        public_address: z.string().trim().optional(),
        local_username: z.string().trim().optional(),
        local_password: z.string().optional(),
        cloud_address: z.string().min(1, { error: 'Server address is required.' }).trim(),
        cloud_username: z.string().min(1, { error: 'Username is required.' }).trim(),
        cloud_password: z.string().min(1, { error: 'Password is required.' }),
        sim_slot: z.enum(['1', '2'], { error: 'SIM slot must be 1 or 2.' }),
        webhook_secret: z.string().trim().optional(),
    })
    .superRefine((data, ctx) => {
        if (data.mode !== 'local') return
        if (!data.public_address?.trim()) {
            ctx.addIssue({
                code: 'custom',
                path: ['public_address'],
                message: 'Public address is required for Local mode (the phone must be reachable from this server).',
            })
        }
        if (!data.local_username?.trim()) {
            ctx.addIssue({ code: 'custom', path: ['local_username'], message: 'Username is required for Local mode.' })
        }
        if (!data.local_password) {
            ctx.addIssue({ code: 'custom', path: ['local_password'], message: 'Password is required for Local mode.' })
        }
    })
