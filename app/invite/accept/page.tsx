import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { accept_workspace_invitation } from '@/app/admin/workspaces/actions'

export default async function AcceptInvitePage({
    searchParams,
}: {
    searchParams: Promise<{ token?: string }>
}) {
    const { token } = await searchParams

    if (!token) {
        return <InviteResult title="Invitation missing" message="This invite link is missing its token." />
    }

    const result = await accept_workspace_invitation(token)
    if (result.success) {
        redirect('/admin/settings')
    }

    return (
        <InviteResult
            title="Invitation could not be accepted"
            message={result.error ?? 'The invite link is invalid or expired.'}
        />
    )
}

function InviteResult({ title, message }: { title: string; message: string }) {
    return (
        <main className="grid min-h-screen place-items-center bg-muted/30 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{message}</p>
                    <Button asChild>
                        <Link href="/login">Go to sign in</Link>
                    </Button>
                </CardContent>
            </Card>
        </main>
    )
}
