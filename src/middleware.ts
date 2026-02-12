import { NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const pathname = request.nextUrl.pathname

  // Handle Supabase auth session
  const { supabaseResponse, user } = await updateSession(request)

  // Check for merchant subdomain
  const isMerchantSubdomain = hostname.startsWith('merchant.')
  
  if (isMerchantSubdomain) {
    // Extract tenant slug from subdomain
    // Format: merchant.{slug}.localhost:3000 or merchant.{slug}.yourdomain.com
    const parts = hostname.split('.')
    const tenantSlug = parts.length > 2 ? parts[1] : null

    // Check if accessing login page
    if (pathname.startsWith('/merchant/login')) {
      return supabaseResponse
    }

    // Check tenant admin session
    const tenantSession = request.cookies.get('tenant_session')
    
    if (!tenantSession && !pathname.startsWith('/merchant/login')) {
      // Redirect to merchant login if no session
      return NextResponse.redirect(new URL('/merchant/login', request.url))
    }

    // Allow merchant routes
    return supabaseResponse
  }

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    // TODO: Add superadmin role check here
    // For now, any authenticated user can access admin
    return supabaseResponse
  }

  // Protect checkout route
  if (pathname.startsWith('/checkout')) {
    const session = request.cookies.get('session')
    
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

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
