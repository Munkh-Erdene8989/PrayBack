import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Tenant } from "@/types";
import type { ResolvedTenant, TenantThemeConfig } from "./types";
import { DEFAULT_THEME } from "./types";

// ==========================================
// Server-side tenant resolution with cache
// ==========================================

/** Simple in-memory cache entry. */
interface CacheEntry {
  tenant: ResolvedTenant | null;
  expiresAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const tenantCache = new Map<string, CacheEntry>();

/**
 * Merge the raw JSONB theme_config with defaults to produce a
 * fully-populated theme object.
 */
export function resolveTheme(
  raw: Record<string, unknown> | null | undefined
): Required<TenantThemeConfig> {
  if (!raw) return { ...DEFAULT_THEME };

  return {
    primaryColor:
      typeof raw.primaryColor === "string"
        ? raw.primaryColor
        : DEFAULT_THEME.primaryColor,
    secondaryColor:
      typeof raw.secondaryColor === "string"
        ? raw.secondaryColor
        : DEFAULT_THEME.secondaryColor,
    accentColor:
      typeof raw.accentColor === "string"
        ? raw.accentColor
        : DEFAULT_THEME.accentColor,
    headerBg:
      typeof raw.headerBg === "string"
        ? raw.headerBg
        : DEFAULT_THEME.headerBg,
    headerText:
      typeof raw.headerText === "string"
        ? raw.headerText
        : DEFAULT_THEME.headerText,
    footerBg:
      typeof raw.footerBg === "string"
        ? raw.footerBg
        : DEFAULT_THEME.footerBg,
    footerText:
      typeof raw.footerText === "string"
        ? raw.footerText
        : DEFAULT_THEME.footerText,
    fontFamily:
      typeof raw.fontFamily === "string"
        ? raw.fontFamily
        : DEFAULT_THEME.fontFamily,
    borderRadius:
      typeof raw.borderRadius === "string" &&
      ["none", "sm", "md", "lg", "full"].includes(raw.borderRadius)
        ? (raw.borderRadius as Required<TenantThemeConfig>["borderRadius"])
        : DEFAULT_THEME.borderRadius,
  };
}

/**
 * Resolve a tenant by its slug.
 * Uses an in-memory cache with TTL to avoid hitting the DB on every request.
 * Returns `null` if the slug doesn't match any tenant.
 */
export async function resolveTenantBySlug(
  slug: string
): Promise<ResolvedTenant | null> {
  const now = Date.now();

  // Check cache
  const cached = tenantCache.get(slug);
  if (cached && cached.expiresAt > now) {
    return cached.tenant;
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("tenants")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error || !data) {
      // Cache the miss to avoid repeated DB lookups for unknown slugs
      tenantCache.set(slug, { tenant: null, expiresAt: now + CACHE_TTL_MS });
      return null;
    }

    const tenant = data as Tenant;
    const resolved: ResolvedTenant = {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      logo_url: tenant.logo_url,
      theme: resolveTheme(tenant.theme_config),
    };

    tenantCache.set(slug, { tenant: resolved, expiresAt: now + CACHE_TTL_MS });
    return resolved;
  } catch {
    return null;
  }
}

/**
 * Bust the cache for a specific tenant slug (e.g. after theme update).
 */
export function invalidateTenantCache(slug?: string) {
  if (slug) {
    tenantCache.delete(slug);
  } else {
    tenantCache.clear();
  }
}

/**
 * Get all known tenant slugs (for middleware validation).
 * Returns a Set of slugs; cached for performance.
 */
let allSlugsCache: { slugs: Set<string>; expiresAt: number } | null = null;

export async function getAllTenantSlugs(): Promise<Set<string>> {
  const now = Date.now();
  if (allSlugsCache && allSlugsCache.expiresAt > now) {
    return allSlugsCache.slugs;
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("tenants")
      .select("slug");

    if (error || !data) return new Set();

    const slugs = new Set(data.map((t: { slug: string }) => t.slug));
    allSlugsCache = { slugs, expiresAt: now + CACHE_TTL_MS };
    return slugs;
  } catch {
    return new Set();
  }
}
