"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useBooks } from "@/lib/tanstack/hooks/useBooks";
import { useCategories } from "@/lib/tanstack/hooks/useCategories";
import { useTenant } from "@/lib/tanstack/hooks/useTenant";
import { BookCard } from "../components/BookCard";

const PAGE_SIZE = 20;

export default function BooksPage() {
  const params = useParams<{ tenant: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tenant = params.tenant;

  const { data: tenantData, isLoading: tenantLoading } = useTenant(tenant);
  const tenantId = tenantData?.id ?? "";
  const { data: categories } = useCategories(tenantId);
  
  // Debug logging
  console.log("Books Page Debug:", { tenant, tenantData, tenantId });

  const topCategories = (categories ?? []).filter((c) => !c.parent_id);

  // URL state
  const initialSearch = searchParams.get("q") ?? "";
  const initialPage = parseInt(searchParams.get("page") ?? "1", 10);
  const activeCategory = searchParams.get("category") ?? "";

  const [searchInput, setSearchInput] = useState(initialSearch);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [page, setPage] = useState(initialPage);

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchTerm(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  // Update URL
  const updateURL = useCallback(
    (q: string, p: number) => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (p > 1) params.set("page", String(p));
      if (activeCategory) params.set("category", activeCategory);
      const qs = params.toString();
      router.replace(`/${tenant}/books${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, tenant, activeCategory]
  );

  useEffect(() => {
    updateURL(searchTerm, page);
  }, [searchTerm, page, updateURL]);

  const offset = (page - 1) * PAGE_SIZE;

  const { data: books, isLoading, error } = useBooks({
    tenantId,
    limit: PAGE_SIZE + 1,
    offset,
    search: searchTerm || undefined,
  });
  
  // Debug logging for books query
  console.log("Books Query Debug:", { tenantId, books, isLoading, error });

  const hasMore = books ? books.length > PAGE_SIZE : false;
  const displayBooks = books ? books.slice(0, PAGE_SIZE) : [];

  const activeCategoryName = topCategories.find((c) => c.id === activeCategory)?.name;

  // Show loading if tenant is still loading
  if (tenantLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-gray-200 rounded w-48" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="aspect-[3/4] bg-gray-200" />
                <div className="p-3 space-y-2">
                  <div className="h-3.5 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded w-1/3 mt-2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-400 mb-6">
        <Link href={`/${tenant}`} className="hover:text-gray-600 transition-colors">Нүүр</Link>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
        <span className="text-gray-600">{activeCategoryName ?? "Номнууд"}</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* ===== Sidebar (desktop) ===== */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <div className="sticky top-24 space-y-6">
            {/* Categories */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Ангилал</h3>
              <ul className="space-y-0.5">
                <li>
                  <Link
                    href={`/${tenant}/books`}
                    className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                      !activeCategory
                        ? "font-semibold text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                    style={!activeCategory ? { backgroundColor: "var(--tenant-primary, #4F46E5)" } : undefined}
                  >
                    Бүгд
                  </Link>
                </li>
                {topCategories.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/${tenant}/books?category=${cat.id}`}
                      className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                        activeCategory === cat.id
                          ? "font-semibold text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                      style={activeCategory === cat.id ? { backgroundColor: "var(--tenant-primary, #4F46E5)" } : undefined}
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        {/* ===== Main content ===== */}
        <div className="flex-1 min-w-0">
          {/* Header + Search + Mobile filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {activeCategoryName ?? "Номнууд"}
              </h1>
              {searchTerm && (
                <p className="text-sm text-gray-400 mt-1">
                  &ldquo;{searchTerm}&rdquo; хайлтын үр дүн
                </p>
              )}
            </div>

            {/* Search bar */}
            <div className="relative w-full sm:w-72">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                type="text"
                placeholder="Ном хайх..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:outline-none transition bg-white"
                style={{ "--tw-ring-color": "var(--tenant-primary, #4F46E5)" } as React.CSSProperties}
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Mobile category chips */}
          <div className="lg:hidden flex gap-2 overflow-x-auto scrollbar-hide pb-4 -mx-1 px-1">
            <Link
              href={`/${tenant}/books`}
              className={`flex-shrink-0 px-3.5 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                !activeCategory
                  ? "text-white border-transparent"
                  : "text-gray-600 border-gray-200 bg-white hover:bg-gray-50"
              }`}
              style={!activeCategory ? { backgroundColor: "var(--tenant-primary, #4F46E5)" } : undefined}
            >
              Бүгд
            </Link>
            {topCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/${tenant}/books?category=${cat.id}`}
                className={`flex-shrink-0 px-3.5 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                  activeCategory === cat.id
                    ? "text-white border-transparent"
                    : "text-gray-600 border-gray-200 bg-white hover:bg-gray-50"
                }`}
                style={activeCategory === cat.id ? { backgroundColor: "var(--tenant-primary, #4F46E5)" } : undefined}
              >
                {cat.name}
              </Link>
            ))}
          </div>

          {/* Book Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
                  <div className="aspect-[3/4] bg-gray-200" />
                  <div className="p-3 space-y-2">
                    <div className="h-3.5 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-4 bg-gray-200 rounded w-1/3 mt-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayBooks.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {displayBooks.map((book) => (
                <BookCard key={book.id} book={book} tenant={tenant} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={0.8}
                stroke="currentColor"
                className="w-16 h-16 mx-auto text-gray-200 mb-4"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
              </svg>
              <p className="text-gray-500">Ном олдсонгүй.</p>
              {searchTerm && (
                <button
                  onClick={() => setSearchInput("")}
                  className="mt-3 text-sm font-medium hover:opacity-80"
                  style={{ color: "var(--tenant-primary, #4F46E5)" }}
                >
                  Хайлт цэвэрлэх
                </button>
              )}
            </div>
          )}

          {/* Pagination */}
          {(page > 1 || hasMore) && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 text-sm font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Өмнөх
              </button>
              <span className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg font-medium">
                {page}
              </span>
              <button
                disabled={!hasMore}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 text-sm font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Дараах
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
