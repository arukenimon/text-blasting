import * as z from 'zod'

export const PasswordSchema = z.object({
    password: z
        .string()
        .min(8, { error: 'Password must be at least 8 characters.' }),
    confirm_password: z.string(),
})

export const SmsGatewaySchema = z
    .object({
        cloud_address: z.string().min(1, { error: 'Server address is required.' }).trim(),
        cloud_username: z.string().min(1, { error: 'Username is required.' }).trim(),
        cloud_password: z.string().min(1, { error: 'Password is required.' }),
        sim_slot: z.enum(['1', '2'], { error: 'SIM slot must be 1 or 2.' }),
        webhook_secret: z.string().trim().optional(),
    })
