import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Edge-compatible middleware for authentication
 *
 * This middleware checks for the presence of the session cookie
 * without verifying the JWT signature (which requires Node.js crypto).
 *
 * The actual authentication verification happens server-side in each page.
 * This middleware only provides quick redirects for better UX.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for session cookie (NextAuth session token)
  // NextAuth v5 uses different cookie names based on environment
  const sessionCookie =
    request.cookies.get("authjs.session-token") ||
    request.cookies.get("__Secure-authjs.session-token") ||
    request.cookies.get("next-auth.session-token") ||
    request.cookies.get("__Secure-next-auth.session-token");

  const hasSessionCookie = !!sessionCookie?.value;

  // Public pages: allow access without session
  // - Login/register pages: redirect to home if already logged in
  // - Shared playground pages: publicly accessible
  if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
    if (hasSessionCookie) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Shared playground pages are publicly accessible
  if (pathname.startsWith("/playground/share/")) {
    return NextResponse.next();
  }

  // Protected pages: redirect to login if no session cookie
  if (!hasSessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api/* (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - Static assets
     */
    "/((?!api/|_next/static|_next/image|favicon.ico|icon.png|opengraph-image.png|manifest.webmanifest|robots.txt|sitemap.xml).*)",
  ],
};
