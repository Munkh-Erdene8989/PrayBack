"use client";

import { useEffect, type ReactNode } from "react";
import type { TenantThemeConfig } from "./types";
import { DEFAULT_THEME } from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert a hex colour to an HSL string that Tailwind can consume. */
function hexToHSL(hex: string): string {
  let r = 0, g = 0, b = 0;
  const h = hex.replace("#", "");

  if (h.length === 3) {
    r = parseInt(h[0] + h[0], 16);
    g = parseInt(h[1] + h[1], 16);
    b = parseInt(h[2] + h[2], 16);
  } else if (h.length === 6) {
    r = parseInt(h.substring(0, 2), 16);
    g = parseInt(h.substring(2, 4), 16);
    b = parseInt(h.substring(4, 6), 16);
  }

  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let hue = 0;
  let sat = 0;
  const lum = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    sat = lum > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        hue = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        hue = ((b - r) / d + 2) / 6;
        break;
      case b:
        hue = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `${Math.round(hue * 360)} ${Math.round(sat * 100)}% ${Math.round(lum * 100)}%`;
}

/** Map border-radius preset to a CSS value. */
function radiusValue(preset: TenantThemeConfig["borderRadius"]): string {
  switch (preset) {
    case "none":
      return "0px";
    case "sm":
      return "0.25rem";
    case "md":
      return "0.5rem";
    case "lg":
      return "0.75rem";
    case "full":
      return "9999px";
    default:
      return "0.75rem";
  }
}

// ---------------------------------------------------------------------------
// CSS Variable Application
// ---------------------------------------------------------------------------

/**
 * Compute the CSS custom-property map from a theme config.
 * These get set on the storefront wrapper element.
 */
export function themeToCSS(
  theme: Required<TenantThemeConfig>
): Record<string, string> {
  return {
    "--tenant-primary": theme.primaryColor,
    "--tenant-primary-hsl": hexToHSL(theme.primaryColor),
    "--tenant-secondary": theme.secondaryColor,
    "--tenant-secondary-hsl": hexToHSL(theme.secondaryColor),
    "--tenant-accent": theme.accentColor,
    "--tenant-accent-hsl": hexToHSL(theme.accentColor),
    "--tenant-header-bg": theme.headerBg,
    "--tenant-header-text": theme.headerText,
    "--tenant-footer-bg": theme.footerBg,
    "--tenant-footer-text": theme.footerText,
    "--tenant-radius": radiusValue(theme.borderRadius),
    ...(theme.fontFamily
      ? { "--tenant-font": theme.fontFamily }
      : {}),
  };
}

// ---------------------------------------------------------------------------
// ThemeApplicator Component
// ---------------------------------------------------------------------------

interface ThemeApplicatorProps {
  theme: Required<TenantThemeConfig>;
  children: ReactNode;
}

/**
 * Wraps children in a <div> that has the tenant's CSS custom properties
 * applied as inline styles, AND sets them on <html> for global reach.
 */
export function ThemeApplicator({ theme, children }: ThemeApplicatorProps) {
  const cssVars = themeToCSS(theme);

  // Also set on <html> so global Tailwind utilities pick them up
  useEffect(() => {
    const root = document.documentElement;
    const entries = Object.entries(cssVars);

    for (const [key, value] of entries) {
      root.style.setProperty(key, value);
    }

    return () => {
      for (const [key] of entries) {
        root.style.removeProperty(key);
      }
    };
  }, [cssVars]);

  return (
    <div style={cssVars as React.CSSProperties} className="contents">
      {children}
    </div>
  );
}

/**
 * Generates a <style> tag string for SSR/initial render.
 * Can be used in a server component or layout head.
 */
export function generateThemeStyleTag(
  theme: Required<TenantThemeConfig>
): string {
  const vars = themeToCSS(theme);
  const rules = Object.entries(vars)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join("\n");

  return `:root {\n${rules}\n}`;
}

/**
 * Returns the default theme CSS variables.
 */
export function getDefaultThemeCSS(): Record<string, string> {
  return themeToCSS(DEFAULT_THEME as Required<TenantThemeConfig>);
}
