import { NextResponse } from"next/server";
import type { NextRequest } from"next/server";

// Route protection based on subscription tier
type SubscriptionTier ='basis'|'groei'|'premium'

// Module routes per tier
const TIER_ROUTES: Record<SubscriptionTier, string[]> = {
 basis: [
'/dashboard','/bedrijven','/contacten','/deals','/offertes','/artikelen','/agenda',
'/abonnement','/instellingen','/documenten'
 ],
 groei: [
'/dashboard','/bedrijven','/contacten','/deals','/offertes','/artikelen','/agenda',
'/projecten','/facturen','/inkomsten','/betalingen',
'/abonnement','/instellingen','/documenten'
 ],
 premium: [
'/dashboard','/bedrijven','/contacten','/deals','/offertes','/artikelen','/agenda',
'/projecten','/facturen','/inkomsten','/betalingen',
'/uitgaven','/ai-assistant','/timesheets','/ai-inbox','/whatsapp',
'/abonnement','/instellingen','/documenten'
 ]
}

// Get tier rank for comparison
function getTierRank(tier: SubscriptionTier | null | undefined): number {
 if (!tier) return 0
 const ranks: Record<SubscriptionTier, number> = { basis: 1, groei: 2, premium: 3 }
 return ranks[tier]
}

// Check if route is accessible for tier
function isRouteAccessible(pathname: string, tier: SubscriptionTier | null): boolean {
 // Public routes
 const publicRoutes = ['/landing','/login','/register','/forgot-password','/reset-password','/auth']
 if (publicRoutes.some(r => pathname.startsWith(r))) return true
 
 // Admin routes - handled separately
 if (pathname.startsWith('/admin') || pathname.startsWith('/super-admin')) return true
 
 // API routes - handled separately
 if (pathname.startsWith('/api')) return true
 
 // Root redirect
 if (pathname ==='/'|| pathname ==='') return true
 
 // Check if route is in allowed list for tier
 const currentTier = tier ||'basis'
 const allowedRoutes = TIER_ROUTES[currentTier]
 
 // Check if any allowed route matches the pathname
 return allowedRoutes.some(route => {
 if (route ==='/dashboard') {
 return pathname ==='/dashboard'|| pathname ==='/dashboard/'
 }
 return pathname.startsWith(route)
 })
}

export function middleware(req: NextRequest) {
 const e2e = process.env.NEXT_PUBLIC_E2E ==="true"|| process.env.E2E ==="true";
 const { pathname } = req.nextUrl;

 // During normal runs, allow through unless protecting admin paths below.
 if (!e2e) {
 // Redirect anonieme bezoekers van"/"naar"/landing"- DISABLED FOR DEV
 if (false && (pathname ==='/'|| pathname ==='')) {
 const cookies = req.cookies;
 const hasSession = !!(
 cookies.get('sb-access-token') ||
 cookies.get('sb-refresh-token') ||
 cookies.get('next-auth.session-token') ||
 cookies.get('session') ||
 cookies.get('token')
 );
 if (!hasSession) {
 const landingUrl = req.nextUrl.clone();
 landingUrl.pathname ='/landing';
 return NextResponse.redirect(landingUrl);
 }
 }

 const cookies = req.cookies;
 const hasSession = !!(cookies.get('sb-access-token') || cookies.get('sb-refresh-token') || cookies.get('next-auth.session-token') || cookies.get('session') || cookies.get('token'));

 // Protect admin and super-admin UI and API routes by requiring an auth cookie.
 const isAdminPath = pathname.startsWith('/super-admin') || pathname.startsWith('/admin') || pathname.startsWith('/api/admin') || pathname.startsWith('/api/super-admin');

 if (isAdminPath) {
 if (!hasSession) {
 const loginUrl = req.nextUrl.clone();
 loginUrl.pathname ='/login';
 loginUrl.searchParams.set('redirect', pathname);
 return NextResponse.redirect(loginUrl);
 }
 }

 // Protect routes based on subscription tier
 if (hasSession && !isAdminPath && !pathname.startsWith('/api')) {
 // Get subscription tier from cookie (set by auth flow)
 const tierCookie = cookies.get('subscription-tier')?.value as SubscriptionTier | undefined
 const userTier: SubscriptionTier = tierCookie ||'basis'
 
 // Check if route is accessible
 if (!isRouteAccessible(pathname, userTier)) {
 // Redirect to dashboard with message
 const dashboardUrl = req.nextUrl.clone();
 dashboardUrl.pathname ='/dashboard';
 dashboardUrl.searchParams.set('upgrade','true');
 dashboardUrl.searchParams.set('required', getTierRank(userTier) < 2 ?'groei':'premium');
 return NextResponse.redirect(dashboardUrl);
 }
 }

 // Not an admin path (or session present): continue.
 return NextResponse.next();
 }

 // Provide simple stub responses for API routes during E2E runs to avoid 503s.
 if (pathname.startsWith("/api")) {
 if (req.method ==="GET") {
 return NextResponse.json({ e2e: true, path: pathname, data: [] });
 }
 if (req.method ==="POST") {
 return NextResponse.json({ e2e: true, path: pathname, ok: true });
 }
 return NextResponse.json({ e2e: true, path: pathname });
 }

 return NextResponse.next();
}

export const config = {
 // Exclude _next and static assets
 matcher: [
"/((?!_next|.*\\..*).*)",
"/api/:path*"
 ],
};
