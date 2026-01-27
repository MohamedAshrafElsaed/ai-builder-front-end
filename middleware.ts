import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
    const token = req.cookies.get("access_token")?.value;
    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname.startsWith("/auth");
    const isAppPage = req.nextUrl.pathname.startsWith("/app");

    // Case 1: Unauthenticated user trying to access protected route -> Redirect to /auth
    if (isAppPage && !isAuth) {
        return NextResponse.redirect(new URL("/auth", req.url));
    }

    // Case 2: Authenticated user trying to access auth page -> Redirect to /app
    // Exception: Callback page should process regardless? No, if already auth, usually redirect to app.
    // But if processing a new login, we might want to allow it.
    // For now, strict redirect.
    if (isAuthPage && isAuth) {
        if (req.nextUrl.pathname.includes("/callback")) {
            // Allow callback to proceed to update updated session
            return NextResponse.next();
        }
        return NextResponse.redirect(new URL("/app", req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/app/:path*", "/auth/:path*"],
};
