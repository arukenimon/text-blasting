import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AuthErrorPage({
    searchParams,
}: {
    searchParams: Promise<{ message?: string }>
}) {
    const { message } = await searchParams

    return (
        <main className="grid min-h-screen place-items-center bg-muted/30 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-3">
                    <div className="flex size-11 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                        <AlertCircle className="size-5" />
                    </div>
                    <CardTitle>Auth link could not be used</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        {message ?? 'This email link is invalid or has expired.'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <Button asChild>
                            <Link href="/login">Go to sign in</Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/forgot-password">Reset password</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </main>
    )
}
