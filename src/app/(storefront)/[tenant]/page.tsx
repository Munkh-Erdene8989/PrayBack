"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useBooks } from "@/lib/tanstack/hooks/useBooks";
import { useCategories } from "@/lib/tanstack/hooks/useCategories";
import { useTenant } from "@/lib/tanstack/hooks/useTenant";
import { BookCard } from "./components/BookCard";

// ---------------------------------------------------------------------------
// Promo Banner
// ---------------------------------------------------------------------------

function PromoBanner({ tenant, storeName }: { tenant: string; storeName: string }) {
  return (
    <section className="relative overflow-hidden">
      <div
        className="text-white"
        style={{
          background: `linear-gradient(135deg, var(--tenant-primary, #4F46E5) 0%, var(--tenant-secondary, #7C3AED) 60%, var(--tenant-accent, #06B6D4) 100%)`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 relative">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/4" />

          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-white/20 backdrop-blur-sm mb-4">
                Шинэ номнууд ирлээ
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
                {storeName}
              </h1>
              <p className="text-base sm:text-lg text-white/80 max-w-lg mb-6">
                Хамгийн шинэ болон эрэлттэй номнуудаа олж, онлайнаар захиалаарай. Хурдан хүргэлт, найдвартай үйлчилгээ.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/${tenant}/books`}
                  className="inline-flex items-center px-6 py-3 bg-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                  style={{ color: "var(--tenant-primary, #4F46E5)" }}
                >
                  Номнууд үзэх
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 ml-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Decorative book stack illustration */}
            <div className="hidden lg:flex justify-center">
              <div className="relative">
                <div className="w-48 h-64 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 transform rotate-3 absolute -right-4 -top-2" />
                <div className="w-48 h-64 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 transform -rotate-3 absolute -left-4 -top-2" />
                <div className="w-48 h-64 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 relative flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={0.5} stroke="currentColor" className="w-24 h-24 text-white/60">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Category Cards
// ---------------------------------------------------------------------------

function CategorySection({ tenantId, tenant }: { tenantId: string; tenant: string }) {
  const { data: categories } = useCategories(tenantId);
  const topCategories = (categories ?? []).filter((c) => !c.parent_id);

  if (topCategories.length === 0) return null;

  const categoryIcons = ["📖", "📕", "📗", "📘", "📙", "📚", "📓", "📒", "📔", "📑"];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Ангилал</h2>
        <Link
          href={`/${tenant}/books`}
          className="text-sm font-medium hover:opacity-80 transition-colors"
          style={{ color: "var(--tenant-primary, #4F46E5)" }}
        >
          Бүгдийг үзэх
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {topCategories.slice(0, 6).map((cat, i) => (
          <Link
            key={cat.id}
            href={`/${tenant}/books?category=${cat.id}`}
            className="group flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200"
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">
              {categoryIcons[i % categoryIcons.length]}
            </span>
            <span className="text-xs font-medium text-gray-700 text-center line-clamp-2">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Book Section (reusable)
// ---------------------------------------------------------------------------

function BookSection({
  title,
  books,
  loading,
  tenant,
  viewAllHref,
}: {
  title: string;
  books: Array<{ id: string; tenant_id: string; title: string; author: string; isbn: string | null; description: string | null; price: number; cover_image_url: string | null; stock: number; category_id: string | null; is_active: boolean; created_at: string }>;
  loading: boolean;
  tenant: string;
  viewAllHref: string;
}) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <Link
          href={viewAllHref}
          className="text-sm font-medium flex items-center gap-1 hover:opacity-80 transition-colors"
          style={{ color: "var(--tenant-primary, #4F46E5)" }}
        >
          Бүгдийг үзэх
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
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
      ) : books.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {books.map((book) => (
            <BookCard key={book.id} book={book} tenant={tenant} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <p className="text-gray-400">Одоогоор ном байхгүй байна.</p>
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Features Banner
// ---------------------------------------------------------------------------

function FeaturesBanner() {
  const features = [
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0H6.375c-.621 0-1.125-.504-1.125-1.125V14.25m17.25 4.5V6.75a3 3 0 0 0-3-3H6.375a3 3 0 0 0-3 3v7.5" />
        </svg>
      ),
      title: "Хурдан хүргэлт",
      desc: "Улаанбаатар хот доторх хүргэлт",
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
        </svg>
      ),
      title: "Найдвартай төлбөр",
      desc: "QPay-ээр аюулгүй төлөөрэй",
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
        </svg>
      ),
      title: "Буцаалт",
      desc: "7 хоногийн дотор буцаах боломж",
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
        </svg>
      ),
      title: "24/7 Дэмжлэг",
      desc: "Хүссэн үедээ холбогдоорой",
    },
  ];

  return (
    <section className="bg-white border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div key={f.title} className="flex items-start gap-3">
              <div
                className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-white"
                style={{ backgroundColor: "var(--tenant-primary, #4F46E5)" }}
              >
                {f.icon}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">{f.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TenantHomePage() {
  const params = useParams<{ tenant: string }>();
  const tenant = params.tenant;
  const { data: tenantData } = useTenant(tenant);
  const tenantId = tenantData?.id ?? "";

  const { data: newBooks, isLoading: newLoading } = useBooks({
    tenantId,
    limit: 10,
  });

  return (
    <>
      <PromoBanner tenant={tenant} storeName={tenantData?.name ?? tenant} />
      <FeaturesBanner />
      <CategorySection tenantId={tenantId} tenant={tenant} />

      {/* Separator */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <hr className="border-gray-100" />
      </div>

      <BookSection
        title="Шинэ номнууд"
        books={newBooks ?? []}
        loading={newLoading}
        tenant={tenant}
        viewAllHref={`/${tenant}/books`}
      />
    </>
  );
}
