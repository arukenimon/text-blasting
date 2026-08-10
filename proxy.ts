import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_FILE = /\.(.*)$/;

function copyResponseCookies(from: NextResponse, to: NextResponse) {
    from.cookies.getAll().forEach((cookie) => {
        to.cookies.set(cookie);
    });
    return to;
}

function redirectWithCookies(
    request: NextRequest,
    response: NextResponse,
    pathname: string,
    redirectTo?: string
) {
    const url = new URL(pathname, request.url);
    if (redirectTo) {
        url.searchParams.set("redirectTo", redirectTo);
    }
    return copyResponseCookies(response, NextResponse.redirect(url));
}

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (PUBLIC_FILE.test(pathname)) {
        return NextResponse.next();
    }

    const response = NextResponse.next({
        request: { headers: request.headers },
    });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const isAdminRoute = pathname.startsWith("/admin");

    if (!supabaseUrl || !supabaseAnonKey) {
        if (isAdminRoute) {
            return redirectWithCookies(request, response, "/login", pathname);
        }
        return response;
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
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
    });

    let user = null;
    try {
        const result = await supabase.auth.getUser();
        user = result.data.user;
    } catch (error) {
        console.warn("[proxy] Supabase auth check failed", error);
    }

    if (!user && isAdminRoute) {
        return redirectWithCookies(request, response, "/login", pathname);
    }

    if (user && pathname === "/login") {
        return copyResponseCookies(response, NextResponse.redirect(new URL("/admin", request.url)));
    }

    return response;
}

export const config = {
    matcher: ["/admin/:path*", "/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
