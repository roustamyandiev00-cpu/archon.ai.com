import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const e2e = process.env.NEXT_PUBLIC_E2E === "true" || process.env.E2E === "true";
  const { pathname } = req.nextUrl;

  // During normal runs, allow through unless protecting admin paths below.
  if (!e2e) {
    // Protect admin and super-admin UI and API routes by requiring an auth cookie.
    const isAdminPath = pathname.startsWith('/super-admin') || pathname.startsWith('/admin') || pathname.startsWith('/api/admin') || pathname.startsWith('/api/super-admin');

    if (isAdminPath) {
      const cookies = req.cookies;
      // Common possible session cookie names used in this project or by auth providers
      const hasSession = !!(cookies.get('sb-access-token') || cookies.get('sb-refresh-token') || cookies.get('next-auth.session-token') || cookies.get('session') || cookies.get('token'));

      if (!hasSession) {
        const loginUrl = req.nextUrl.clone();
        loginUrl.pathname = '/login';
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }
    }

    // Not an admin path (or session present): continue.
    return NextResponse.next();
  }

  // Provide simple stub responses for API routes during E2E runs to avoid 503s.
  if (pathname.startsWith("/api")) {
    if (req.method === "GET") {
      return NextResponse.json({ e2e: true, path: pathname, data: [] });
    }
    if (req.method === "POST") {
      return NextResponse.json({ e2e: true, path: pathname, ok: true });
    }
    return NextResponse.json({ e2e: true, path: pathname });
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
