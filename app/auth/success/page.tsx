import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function safeNext(next?: string) {
    if (next?.startsWith('/') && !next.startsWith('//')) return next
    return '/admin/dashboard'
}

function copyFor(type?: string) {
    switch (type) {
        case 'invite':
            return {
                title: 'Invitation verified',
                message: 'Your invitation link was verified. Continue to finish joining the workspace.',
                action: 'Continue',
            }
        case 'email_change':
            return {
                title: 'Email address confirmed',
                message: 'Your new email address has been confirmed.',
                action: 'Continue',
            }
        case 'magiclink':
            return {
                title: 'Invitation sign-in verified',
                message: 'Your email link was verified. Continue to accept the workspace invitation.',
                action: 'Continue',
            }
        case 'invite_accepted':
            return {
                title: 'Invitation accepted',
                message: 'You have joined the workspace and your active workspace was updated.',
                action: 'Go to workspace settings',
            }
        default:
            return {
                title: 'Email confirmed',
                message: 'Your email address has been confirmed successfully.',
                action: 'Continue',
            }
    }
}

export default async function AuthSuccessPage({
    searchParams,
}: {
    searchParams: Promise<{ type?: string; next?: string }>
}) {
    const { type, next } = await searchParams
    const content = copyFor(type)

    return (
        <main className="grid min-h-screen place-items-center bg-muted/30 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-3">
                    <div className="flex size-11 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                        <CheckCircle2 className="size-5" />
                    </div>
                    <CardTitle>{content.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{content.message}</p>
                    <Button asChild>
                        <Link href={safeNext(next)}>{content.action}</Link>
                    </Button>
                </CardContent>
            </Card>
        </main>
    )
}
