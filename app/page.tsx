// Welcome


export default function Home() {
    return (
        <div className="min-h-screen bg-muted/40 flex items-center justify-center p-4">
            <div className="text-center">
                <h1 className="text-4xl font-bold">Welcome to Text Blasting!</h1>
                <p className="mt-4 text-lg text-muted-foreground">
                    Please <a href="/login" className="text-primary underline">log in</a> to access the dashboard and manage your SMS campaigns.
                </p>
            </div>
        </div>
    );
}