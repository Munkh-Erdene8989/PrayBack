// ==========================================
// Theme Configuration Types
// ==========================================

/**
 * Theme configuration stored in tenant.theme_config (JSONB).
 * Each property maps to a CSS custom property applied to the storefront.
 */
export interface TenantThemeConfig {
  /** Primary brand color (buttons, links, accents). Default: #4F46E5 */
  primaryColor?: string;
  /** Secondary color (gradients, highlights). Default: #7C3AED */
  secondaryColor?: string;
  /** Accent color (badges, CTAs). Default: #06B6D4 */
  accentColor?: string;
  /** Header background color. Default: #ffffff */
  headerBg?: string;
  /** Header text color. Default: #111827 */
  headerText?: string;
  /** Footer background color. Default: #ffffff */
  footerBg?: string;
  /** Footer text color. Default: #9CA3AF */
  footerText?: string;
  /** Custom font family name (must be available via Google Fonts or system). */
  fontFamily?: string;
  /** Border radius preset: "none" | "sm" | "md" | "lg" | "full". Default: "lg" */
  borderRadius?: "none" | "sm" | "md" | "lg" | "full";
}

/** Defaults applied when a tenant hasn't customised their theme. */
export const DEFAULT_THEME: Required<TenantThemeConfig> = {
  primaryColor: "#4F46E5",
  secondaryColor: "#7C3AED",
  accentColor: "#06B6D4",
  headerBg: "#ffffff",
  headerText: "#111827",
  footerBg: "#ffffff",
  footerText: "#9CA3AF",
  fontFamily: "",
  borderRadius: "lg",
};

/**
 * Resolved tenant information available throughout the app.
 */
export interface ResolvedTenant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  theme: Required<TenantThemeConfig>;
}
