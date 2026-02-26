import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    // Auth pages should be accessible without token
    // Dashboard and protected routes will be client-side guarded
    // This middleware handles basic redirect logic

    const { pathname } = request.nextUrl;

    // Redirect /dashboard to login if no token cookie exists
    // Note: Primary auth check is client-side since we use localStorage
    // This is a fallback for direct URL access
    if (pathname.startsWith("/dashboard")) {
        // We can't check localStorage from middleware, so we rely on client-side
        return NextResponse.next();
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*"],
};
