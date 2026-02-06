"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useBook } from "@/lib/tanstack/hooks/useBooks";
import { useCart } from "@/lib/tanstack/hooks/useCart";

export default function BookDetailPage() {
  const params = useParams<{ tenant: string; id: string }>();
  const router = useRouter();
  const tenant = params.tenant;
  const bookId = params.id;

  const { data: book, isLoading, error } = useBook(bookId);
  const { addToCart } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [addedFeedback, setAddedFeedback] = useState(false);

  const formattedPrice = book
    ? new Intl.NumberFormat("mn-MN").format(book.price)
    : "";

  const handleAddToCart = () => {
    if (!book) return;
    addToCart.mutate({ book, quantity });
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-32 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="aspect-[3/4] bg-gray-200 rounded-2xl" />
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-7 bg-gray-200 rounded w-1/4 mt-4" />
              <div className="space-y-2 mt-6">
                <div className="h-3 bg-gray-200 rounded" />
                <div className="h-3 bg-gray-200 rounded" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-10 h-10 text-gray-300">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Ном олдсонгүй</h2>
        <p className="text-gray-500 mb-6">Энэ ном устгагдсан эсвэл байхгүй байна.</p>
        <button
          onClick={() => router.back()}
          className="font-medium hover:opacity-80"
          style={{ color: "var(--tenant-primary, #4F46E5)" }}
        >
          Буцах
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-400 mb-6">
        <Link href={`/${tenant}`} className="hover:text-gray-600 transition-colors">Нүүр</Link>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
        <Link href={`/${tenant}/books`} className="hover:text-gray-600 transition-colors">Номнууд</Link>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
        <span className="text-gray-600 truncate max-w-[200px]">{book.title}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8 lg:gap-12">
        {/* Cover Image - 2 cols */}
        <div className="md:col-span-2">
          <div className="aspect-[3/4] bg-gray-50 rounded-2xl overflow-hidden shadow-sm border border-gray-100 sticky top-24">
            {book.cover_image_url ? (
              <img
                src={book.cover_image_url}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{
                  background: `linear-gradient(145deg, color-mix(in srgb, var(--tenant-primary, #4F46E5) 8%, white), color-mix(in srgb, var(--tenant-secondary, #7C3AED) 8%, white))`,
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={0.5} stroke="currentColor" className="w-28 h-28 text-gray-200">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Book Info - 3 cols */}
        <div className="md:col-span-3 flex flex-col">
          {book.category && (
            <Link
              href={`/${tenant}/books?category=${book.category_id}`}
              className="inline-flex self-start px-3 py-1 text-xs font-medium rounded-full mb-3 transition-colors"
              style={{
                backgroundColor: "color-mix(in srgb, var(--tenant-primary, #4F46E5) 10%, white)",
                color: "var(--tenant-primary, #4F46E5)",
              }}
            >
              {book.category.name}
            </Link>
          )}

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 leading-tight">
            {book.title}
          </h1>

          <p className="text-gray-500 text-lg mb-4">{book.author}</p>

          {/* Price card */}
          <div className="bg-white border border-gray-100 rounded-xl p-5 mb-6 shadow-sm">
            <div className="flex items-baseline gap-2 mb-4">
              <span
                className="text-3xl font-extrabold"
                style={{ color: "var(--tenant-primary, #4F46E5)" }}
              >
                {formattedPrice}₮
              </span>
            </div>

            {/* Stock info */}
            <div className="flex items-center gap-2 mb-5">
              {book.stock > 0 ? (
                <>
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm text-green-700 font-medium">
                    Нөөцөд байгаа ({book.stock} ш)
                  </span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 bg-red-500 rounded-full" />
                  <span className="text-sm text-red-600 font-medium">Дууссан</span>
                </>
              )}
            </div>

            {/* Add to Cart */}
            {book.stock > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3.5 py-2.5 text-gray-600 hover:bg-gray-100 transition rounded-l-lg"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                    </svg>
                  </button>
                  <span className="px-5 py-2.5 text-sm font-semibold border-x border-gray-200 min-w-[48px] text-center bg-white">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(book.stock, q + 1))}
                    className="px-3.5 py-2.5 text-gray-600 hover:bg-gray-100 transition rounded-r-lg"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={addToCart.isPending}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 disabled:opacity-60 ${
                    addedFeedback ? "bg-green-600 scale-[0.98]" : "hover:opacity-90 hover:shadow-md"
                  }`}
                  style={!addedFeedback ? { backgroundColor: "var(--tenant-primary, #4F46E5)" } : undefined}
                >
                  {addedFeedback ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                      Сагсанд нэмэгдлээ
                    </>
                  ) : addToCart.isPending ? (
                    "Нэмж байна..."
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                      </svg>
                      Сагсанд нэмэх
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Description */}
          {book.description && (
            <div className="bg-white border border-gray-100 rounded-xl p-5 mb-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
                Тайлбар
              </h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line text-sm">
                {book.description}
              </p>
            </div>
          )}

          {/* Meta info */}
          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
              </svg>
              Дэлгэрэнгүй мэдээлэл
            </h3>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {book.isbn && (
                <>
                  <dt className="text-gray-400">ISBN</dt>
                  <dd className="font-medium text-gray-900">{book.isbn}</dd>
                </>
              )}
              {book.category && (
                <>
                  <dt className="text-gray-400">Ангилал</dt>
                  <dd className="font-medium text-gray-900">{book.category.name}</dd>
                </>
              )}
              <dt className="text-gray-400">Зохиолч</dt>
              <dd className="font-medium text-gray-900">{book.author}</dd>
              <dt className="text-gray-400">Нөөц</dt>
              <dd className="font-medium text-gray-900">{book.stock} ширхэг</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
