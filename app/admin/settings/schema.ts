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

export const SmsGatewaySchema = z.object({
    local_address: z.string().min(1, { error: 'Local address is required.' }).trim(),
    public_address: z.string().trim(),
    local_username: z.string().min(1, { error: 'Username is required.' }).trim(),
    local_password: z.string().min(1, { error: 'Password is required.' }),
    cloud_address: z.string().min(1, { error: 'Server address is required.' }).trim(),
    cloud_username: z.string().min(1, { error: 'Username is required.' }).trim(),
    cloud_password: z.string().min(1, { error: 'Password is required.' }),
})
