"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import type { ResolvedTenant } from "./types";
import { DEFAULT_THEME } from "./types";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const TenantContext = createContext<ResolvedTenant | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface TenantProviderProps {
  tenant: ResolvedTenant;
  children: ReactNode;
}

/**
 * Provides resolved tenant data (including theme) to all child components.
 * Should wrap the storefront layout.
 */
export function TenantProvider({ tenant, children }: TenantProviderProps) {
  return (
    <TenantContext.Provider value={tenant}>{children}</TenantContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Access the current tenant context.
 * Throws if used outside of a TenantProvider.
 */
export function useTenantContext(): ResolvedTenant {
  const ctx = useContext(TenantContext);
  if (!ctx) {
    throw new Error("useTenantContext must be used within a <TenantProvider>");
  }
  return ctx;
}

/**
 * Safe version that returns null when no provider is found.
 */
export function useTenantContextSafe(): ResolvedTenant | null {
  return useContext(TenantContext);
}

/**
 * Convenience hook that returns only the resolved theme.
 */
export function useTenantTheme() {
  const ctx = useContext(TenantContext);
  return ctx?.theme ?? DEFAULT_THEME;
}
