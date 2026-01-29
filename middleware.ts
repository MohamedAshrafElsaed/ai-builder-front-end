import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
    const token = req.cookies.get("access_token")?.value;
    const isAuth = !!token;
    const pathname = req.nextUrl.pathname;

    // Allow callback to always proceed (it handles its own auth)
    if (pathname === "/auth/callback") {
        return NextResponse.next();
    }

    const isAuthPage = pathname.startsWith("/auth");
    const isAppPage = pathname.startsWith("/app");

    // Unauthenticated user trying to access protected route
    if (isAppPage && !isAuth) {
        const url = new URL("/auth", req.url);
        return NextResponse.redirect(url);
    }

    // Authenticated user trying to access auth pages (except callback)
    if (isAuthPage && isAuth) {
        const url = new URL("/app", req.url);
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/app/:path*", "/auth/:path*"],
};