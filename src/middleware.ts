import { NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { verifySessionToken } from '@/lib/auth/session'

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const pathname = request.nextUrl.pathname

  // Handle Supabase auth session
  const { supabaseResponse, user } = await updateSession(request)

  // Custom JWT session (phone+PIN login) – for superadmin /admin access
  const sessionToken = request.cookies.get('session')?.value
  const customSession = await verifySessionToken(sessionToken)
  const isSuperadmin = customSession?.role === 'superadmin'

  // Merchant admin: only single host (merchant.mydomain.mn), NOT per-tenant subdomains (merchant.{slug}.mydomain.mn)
  const host = hostname.split(':')[0]
  const merchantHost =
    process.env.MERCHANT_HOST ||
    (process.env.NODE_ENV === 'development' ? 'merchant.localhost' : 'merchant.mydomain.mn')
  const isMerchantPortal = host === merchantHost

  if (isMerchantPortal) {
    // Check if accessing login page
    if (pathname.startsWith('/merchant/login')) {
      return supabaseResponse
    }

    // Check tenant admin session
    const tenantSession = request.cookies.get('tenant_session')

    if (!tenantSession && !pathname.startsWith('/merchant/login')) {
      return NextResponse.redirect(new URL('/merchant/login', request.url))
    }

    return supabaseResponse
  }

  // Protect admin routes: allow Supabase user or custom session superadmin
  if (pathname.startsWith('/admin')) {
    if (!user && !isSuperadmin) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return supabaseResponse
  }

  // Allow guest checkout - no authentication required
  // Authentication check is handled in the checkout page component itself

  // Allow all other routes
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
