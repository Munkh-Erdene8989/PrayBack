import { NextResponse, type NextRequest } from "next/server";

// ==========================================
// Next.js Middleware — Multi-Tenant Routing
// ==========================================
//
// Responsibilities:
// 1. Validate tenant slug for storefront and admin routes
// 2. Protect admin routes (require authenticated admin/superadmin)
// 3. Pass tenant slug via request headers for downstream use
// 4. Handle redirects for root and invalid slugs
//

// ---------------------------------------------------------------------------
// Known path prefixes that are NOT tenant slugs
// ---------------------------------------------------------------------------

const RESERVED_PATHS = new Set([
  "api",
  "login",
  "verify",
  "register",
  "tenant-not-found",
  "_next",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
]);

// ---------------------------------------------------------------------------
// In-memory tenant slug cache (lightweight — middleware runs at the edge)
// ---------------------------------------------------------------------------

interface SlugCache {
  slugs: Set<string>;
  expiresAt: number;
}

let slugCache: SlugCache | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function fetchTenantSlugs(): Promise<Set<string>> {
  const now = Date.now();
  if (slugCache && slugCache.expiresAt > now) {
    return slugCache.slugs;
  }

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      console.warn("[middleware] Missing Supabase env vars — skipping tenant validation");
      return new Set();
    }

    const res = await fetch(`${url}/rest/v1/tenants?select=slug`, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
      // Next.js fetch cache
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      console.error("[middleware] Failed to fetch tenant slugs:", res.status);
      return slugCache?.slugs ?? new Set();
    }

    const data: { slug: string }[] = await res.json();
    const slugs = new Set(data.map((t) => t.slug));

    slugCache = { slugs, expiresAt: now + CACHE_TTL };
    return slugs;
  } catch (err) {
    console.error("[middleware] Error fetching tenant slugs:", err);
    return slugCache?.slugs ?? new Set();
  }
}

// ---------------------------------------------------------------------------
// JWT decoding (lightweight — no full verification in middleware)
// ---------------------------------------------------------------------------

interface JwtClaims {
  user_id?: string;
  role?: string;
  tenant_id?: string | null;
}

function decodeJwtPayload(token: string): JwtClaims | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf-8")
    );
    return payload as JwtClaims;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets, API routes, auth pages, and Next.js internals
  const firstSegment = pathname.split("/")[1] ?? "";
  if (!firstSegment || RESERVED_PATHS.has(firstSegment) || firstSegment.startsWith("_")) {
    return NextResponse.next();
  }

  // --- ADMIN ROUTES: /admin/:tenant/* ---
  if (firstSegment === "admin") {
    const tenantSlug = pathname.split("/")[2];

    if (!tenantSlug) {
      // /admin with no tenant — redirect to home
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Validate tenant slug
    const validSlugs = await fetchTenantSlugs();
    if (validSlugs.size > 0 && !validSlugs.has(tenantSlug)) {
      // Unknown tenant — show 404
      return NextResponse.rewrite(new URL("/tenant-not-found", request.url));
    }

    // Check for admin authentication
    const token =
      request.cookies.get("bookstore_token")?.value ??
      request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      // Not logged in — redirect to login with return URL
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("returnTo", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const claims = decodeJwtPayload(token);
    if (!claims || !claims.role || !["admin", "superadmin"].includes(claims.role)) {
      // Not an admin — redirect to login
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("returnTo", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Pass tenant info in headers
    const response = NextResponse.next();
    response.headers.set("x-tenant-slug", tenantSlug);
    if (claims.user_id) {
      response.headers.set("x-user-id", claims.user_id);
    }
    return response;
  }

  // --- STOREFRONT ROUTES: /:tenant/* ---
  const tenantSlug = firstSegment;

  // Validate tenant slug
  const validSlugs = await fetchTenantSlugs();
  if (validSlugs.size > 0 && !validSlugs.has(tenantSlug)) {
    // Not a known tenant — might be an unknown page, show 404
    return NextResponse.rewrite(new URL("/tenant-not-found", request.url));
  }

  // Valid tenant — pass slug in header and continue
  const response = NextResponse.next();
  response.headers.set("x-tenant-slug", tenantSlug);
  return response;
}

// ---------------------------------------------------------------------------
// Matcher: only run middleware on pages, not on API/static
// ---------------------------------------------------------------------------

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (/api/*)
     * - Next.js internals (/_next/*)
     * - Static files (favicon, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)",
  ],
};
