"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode, type FormEvent } from "react";
import { useCart } from "@/lib/tanstack/hooks/useCart";
import { useTenant } from "@/lib/tanstack/hooks/useTenant";
import { useCategories } from "@/lib/tanstack/hooks/useCategories";
import { useAuth } from "@/lib/auth/context";
import { TenantProvider } from "@/lib/tenant/context";
import { ThemeApplicator } from "@/lib/tenant/theme";
import { resolveTheme } from "@/lib/tenant/resolve";
import type { ResolvedTenant } from "@/lib/tenant/types";

// ---------------------------------------------------------------------------
// Category Navigation Bar
// ---------------------------------------------------------------------------

function CategoryNav() {
  const params = useParams<{ tenant: string }>();
  const tenant = params.tenant;
  const { data: tenantData } = useTenant(tenant);
  const { data: categories } = useCategories(tenantData?.id ?? "");

  // Only show top-level categories (no parent)
  const topCategories = (categories ?? []).filter((c) => !c.parent_id);

  if (topCategories.length === 0) return null;

  return (
    <div
      className="border-b border-gray-100 overflow-x-auto scrollbar-hide"
      style={{ backgroundColor: "var(--tenant-header-bg, #ffffff)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1 py-2 -mx-2">
          <Link
            href={`/${tenant}/books`}
            className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-full transition-colors hover:bg-gray-100"
            style={{ color: "var(--tenant-primary, #4F46E5)" }}
          >
            Бүх ном
          </Link>
          {topCategories.slice(0, 10).map((cat) => (
            <Link
              key={cat.id}
              href={`/${tenant}/books?category=${cat.id}`}
              className="flex-shrink-0 px-3 py-1.5 text-xs text-gray-600 font-medium rounded-full transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function StorefrontHeader() {
  const params = useParams<{ tenant: string }>();
  const tenant = params.tenant;
  const pathname = usePathname();
  const router = useRouter();
  const { totalItems } = useCart();
  const { data: tenantData } = useTenant(tenant);
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  const navLinks = [
    { href: `/${tenant}`, label: "Нүүр" },
    { href: `/${tenant}/books`, label: "Номнууд" },
    { href: `/${tenant}/orders`, label: "Захиалга" },
  ];

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/${tenant}/books?q=${encodeURIComponent(searchInput.trim())}`);
      setSearchInput("");
      setSearchOpen(false);
      setMenuOpen(false);
    }
  };

  return (
    <>
      {/* ===== Top utility bar ===== */}
      <div className="bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-8 text-[11px]">
          <span className="hidden sm:inline">
            Тавтай морил, {tenantData?.name ?? "Bookstore"}-д тавтай морилно уу!
          </span>
          <div className="flex items-center gap-4 ml-auto">
            {user ? (
              <>
                <Link
                  href={`/${tenant}/orders`}
                  className="hover:text-white transition-colors"
                >
                  Захиалга
                </Link>
                <button
                  onClick={logout}
                  className="hover:text-white transition-colors"
                >
                  Гарах
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="hover:text-white transition-colors"
              >
                Нэвтрэх / Бүртгүүлэх
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ===== Main header ===== */}
      <header
        className="sticky top-0 z-50 border-b shadow-sm"
        style={{
          backgroundColor: "var(--tenant-header-bg, #ffffff)",
          borderColor: "#e5e7eb",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Mobile burger */}
            <button
              className="lg:hidden p-2 -ml-2 text-gray-600 hover:text-gray-900"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>

            {/* Logo */}
            <Link href={`/${tenant}`} className="flex items-center gap-2.5 flex-shrink-0">
              {tenantData?.logo_url ? (
                <img
                  src={tenantData.logo_url}
                  alt={tenantData.name}
                  className="h-9 w-9 rounded-lg object-cover"
                />
              ) : (
                <span
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-base"
                  style={{ backgroundColor: "var(--tenant-primary, #4F46E5)" }}
                >
                  {tenantData?.name?.[0]?.toUpperCase() ?? "B"}
                </span>
              )}
              <div className="hidden sm:block">
                <span
                  className="text-lg font-bold leading-tight block"
                  style={{ color: "var(--tenant-header-text, #111827)" }}
                >
                  {tenantData?.name ?? tenant}
                </span>
                <span className="text-[10px] text-gray-400 leading-none">Онлайн номын дэлгүүр</span>
              </div>
            </Link>

            {/* Desktop search bar */}
            <form
              onSubmit={handleSearch}
              className="hidden lg:flex flex-1 max-w-xl mx-8"
            >
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Ном, зохиолч хайх..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full h-10 pl-4 pr-12 border-2 rounded-full text-sm outline-none transition-colors bg-gray-50 focus:bg-white"
                  style={{
                    borderColor: "var(--tenant-primary, #4F46E5)",
                  }}
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1 h-8 w-8 rounded-full flex items-center justify-center text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "var(--tenant-primary, #4F46E5)" }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                </button>
              </div>
            </form>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "text-white"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                    style={isActive ? { backgroundColor: "var(--tenant-primary, #4F46E5)" } : undefined}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right icons */}
            <div className="flex items-center gap-1">
              {/* Mobile search toggle */}
              <button
                className="lg:hidden p-2 text-gray-600 hover:text-gray-900"
                onClick={() => setSearchOpen(!searchOpen)}
                aria-label="Search"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
              </button>

              {/* User icon (desktop) */}
              {user ? (
                <Link
                  href={`/${tenant}/orders`}
                  className="hidden lg:flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                  <span className="text-sm font-medium truncate max-w-[100px]">
                    {user.name ?? user.phone}
                  </span>
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="hidden lg:flex p-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                </Link>
              )}

              {/* Cart */}
              <Link
                href={`/${tenant}/cart`}
                className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
                {totalItems > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 text-white text-[10px] font-bold rounded-full h-[18px] min-w-[18px] px-1 flex items-center justify-center"
                    style={{ backgroundColor: "var(--tenant-primary, #4F46E5)" }}
                  >
                    {totalItems > 99 ? "99+" : totalItems}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile search bar */}
        {searchOpen && (
          <div className="lg:hidden border-t border-gray-100 px-4 py-3" style={{ backgroundColor: "var(--tenant-header-bg, #ffffff)" }}>
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Ном, зохиолч хайх..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                autoFocus
                className="w-full h-10 pl-4 pr-12 border-2 rounded-full text-sm outline-none bg-gray-50 focus:bg-white"
                style={{ borderColor: "var(--tenant-primary, #4F46E5)" }}
              />
              <button
                type="submit"
                className="absolute right-1 top-1 h-8 w-8 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: "var(--tenant-primary, #4F46E5)" }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
              </button>
            </form>
          </div>
        )}

        {/* Category nav bar */}
        <CategoryNav />
      </header>

      {/* ===== Mobile slide-over menu ===== */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 bg-white shadow-xl flex flex-col animate-in slide-in-from-left">
            {/* Close */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <span className="font-bold text-gray-900">{tenantData?.name ?? tenant}</span>
              <button onClick={() => setMenuOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "text-white"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                    style={isActive ? { backgroundColor: "var(--tenant-primary, #4F46E5)" } : undefined}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* User */}
            <div className="border-t border-gray-100 p-4">
              {user ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 truncate">{user.name ?? user.phone}</p>
                  <button
                    onClick={() => { logout(); setMenuOpen(false); }}
                    className="text-sm text-red-600 font-medium"
                  >
                    Гарах
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block w-full text-center py-2.5 text-sm font-semibold text-white rounded-lg"
                  style={{ backgroundColor: "var(--tenant-primary, #4F46E5)" }}
                >
                  Нэвтрэх
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

function StorefrontFooter() {
  const params = useParams<{ tenant: string }>();
  const tenant = params.tenant;
  const { data: tenantData } = useTenant(tenant);

  return (
    <footer
      className="border-t"
      style={{
        backgroundColor: "var(--tenant-footer-bg, #ffffff)",
        borderColor: "#e5e7eb",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href={`/${tenant}`} className="flex items-center gap-2 mb-3">
              {tenantData?.logo_url ? (
                <img src={tenantData.logo_url} alt={tenantData.name} className="h-8 w-8 rounded-lg object-cover" />
              ) : (
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: "var(--tenant-primary, #4F46E5)" }}
                >
                  {tenantData?.name?.[0]?.toUpperCase() ?? "B"}
                </span>
              )}
              <span className="font-bold" style={{ color: "var(--tenant-footer-text, #9CA3AF)" }}>
                {tenantData?.name ?? tenant}
              </span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              Хамгийн шинэ болон эрэлттэй номнуудаа онлайнаар захиалаарай.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Холбоос</h4>
            <ul className="space-y-2">
              <li><Link href={`/${tenant}/books`} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">Номнууд</Link></li>
              <li><Link href={`/${tenant}/orders`} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">Захиалга</Link></li>
              <li><Link href={`/${tenant}/cart`} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">Сагс</Link></li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Мэдээлэл</h4>
            <ul className="space-y-2">
              <li><span className="text-sm text-gray-400">Хүргэлтийн бодлого</span></li>
              <li><span className="text-sm text-gray-400">Буцаалтын бодлого</span></li>
              <li><span className="text-sm text-gray-400">Нууцлалын бодлого</span></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Холбоо барих</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 flex-shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                </svg>
                7700-0000
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 flex-shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
                info@bookstore.mn
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} {tenantData?.name ?? "Bookstore SaaS"}. Бүх эрх хамгаалагдсан.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ---------------------------------------------------------------------------
// Layout with Theme + Tenant Provider
// ---------------------------------------------------------------------------

export default function StorefrontLayout({ children }: { children: ReactNode }) {
  const params = useParams<{ tenant: string }>();
  const { data: tenantData } = useTenant(params.tenant);

  const theme = resolveTheme(tenantData?.theme_config ?? null);
  const resolvedTenant: ResolvedTenant = {
    id: tenantData?.id ?? "",
    name: tenantData?.name ?? params.tenant,
    slug: tenantData?.slug ?? params.tenant,
    logo_url: tenantData?.logo_url ?? null,
    theme,
  };

  return (
    <TenantProvider tenant={resolvedTenant}>
      <ThemeApplicator theme={theme}>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <StorefrontHeader />
          <main className="flex-1">{children}</main>
          <StorefrontFooter />
        </div>
      </ThemeApplicator>
    </TenantProvider>
  );
}
