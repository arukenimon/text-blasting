import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
    const response = NextResponse.next({
        request: { headers: request.headers },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value);
                        response.cookies.set(name, value, options);
                    });
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;
    const isAdminRoute = pathname.startsWith("/admin");

    // Unauthenticated user trying to access admin → redirect to login
    if (!user && isAdminRoute) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirectTo", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Authenticated user on a non-admin route → redirect to /admin
    if (user && !isAdminRoute) {
        return NextResponse.redirect(new URL("/admin", request.url));
    }

    return response;
}

export const config = {
    // Match /admin/* AND every other top-level route (includes /, /login, etc.)
    matcher: ["/admin/:path*", "/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
