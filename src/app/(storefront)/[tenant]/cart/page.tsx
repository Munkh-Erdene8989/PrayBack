"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCart } from "@/lib/tanstack/hooks/useCart";

export default function CartPage() {
  const params = useParams<{ tenant: string }>();
  const tenant = params.tenant;
  const { items, totalAmount, totalItems, removeFromCart, updateQuantity, clearCart } =
    useCart();

  const formattedTotal = new Intl.NumberFormat("mn-MN").format(totalAmount);

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-50 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={0.8} stroke="currentColor" className="w-12 h-12 text-gray-300">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Сагс хоосон байна</h2>
        <p className="text-gray-500 mb-8">Номын каталогоос дуртай номоо сонгон сагсандаа нэмнэ үү.</p>
        <Link
          href={`/${tenant}/books`}
          className="inline-flex items-center px-6 py-3 text-white font-semibold rounded-lg hover:opacity-90 transition-all shadow-md hover:shadow-lg"
          style={{ backgroundColor: "var(--tenant-primary, #4F46E5)" }}
        >
          Номнууд үзэх
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 ml-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-400 mb-6">
        <Link href={`/${tenant}`} className="hover:text-gray-600 transition-colors">Нүүр</Link>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
        <span className="text-gray-600">Сагс</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Миний сагс
          <span className="text-base text-gray-400 font-normal ml-2">({totalItems} ном)</span>
        </h1>
        <button
          onClick={() => clearCart.mutate()}
          className="text-sm text-red-500 hover:text-red-700 transition-colors font-medium"
        >
          Бүгдийг устгах
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => {
            const itemTotal = new Intl.NumberFormat("mn-MN").format(item.book.price * item.quantity);
            const unitPrice = new Intl.NumberFormat("mn-MN").format(item.book.price);

            return (
              <div
                key={item.book.id}
                className="bg-white rounded-xl border border-gray-100 p-4 flex gap-4 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Image */}
                <Link
                  href={`/${tenant}/books/${item.book.id}`}
                  className="flex-shrink-0 w-20 h-28 rounded-lg overflow-hidden bg-gray-50 border border-gray-100"
                >
                  {item.book.cover_image_url ? (
                    <img src={item.book.cover_image_url} alt={item.book.title} className="w-full h-full object-cover" />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{
                        background: `linear-gradient(145deg, color-mix(in srgb, var(--tenant-primary, #4F46E5) 8%, white), color-mix(in srgb, var(--tenant-secondary, #7C3AED) 8%, white))`,
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-8 h-8 text-gray-300">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                      </svg>
                    </div>
                  )}
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col">
                  <Link
                    href={`/${tenant}/books/${item.book.id}`}
                    className="font-semibold text-gray-900 text-sm hover:underline line-clamp-1"
                  >
                    {item.book.title}
                  </Link>
                  <p className="text-xs text-gray-400 mt-0.5">{item.book.author}</p>
                  <p className="text-sm text-gray-500 mt-1">{unitPrice}₮ / ш</p>

                  <div className="flex items-center justify-between mt-auto pt-3">
                    <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50">
                      <button
                        onClick={() =>
                          item.quantity <= 1
                            ? removeFromCart.mutate(item.book.id)
                            : updateQuantity.mutate({ bookId: item.book.id, quantity: item.quantity - 1 })
                        }
                        className="px-2.5 py-1.5 text-gray-500 hover:bg-gray-100 transition text-sm rounded-l-lg"
                      >
                        {item.quantity <= 1 ? (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 text-red-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                          </svg>
                        )}
                      </button>
                      <span className="px-3 py-1.5 text-sm font-medium border-x border-gray-200 min-w-[36px] text-center bg-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity.mutate({ bookId: item.book.id, quantity: item.quantity + 1 })}
                        className="px-2.5 py-1.5 text-gray-500 hover:bg-gray-100 transition text-sm rounded-r-lg"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                      </button>
                    </div>

                    <span
                      className="font-bold text-sm"
                      style={{ color: "var(--tenant-primary, #4F46E5)" }}
                    >
                      {itemTotal}₮
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm sticky top-24">
            <h2 className="font-bold text-gray-900 mb-4 text-lg">Захиалгын мэдээлэл</h2>

            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Номны тоо</dt>
                <dd className="font-medium text-gray-900">{totalItems} ширхэг</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Хүргэлт</dt>
                <dd className="font-medium text-green-600">Үнэгүй</dd>
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between">
                <dt className="font-bold text-gray-900">Нийт дүн</dt>
                <dd
                  className="font-extrabold text-xl"
                  style={{ color: "var(--tenant-primary, #4F46E5)" }}
                >
                  {formattedTotal}₮
                </dd>
              </div>
            </dl>

            <Link
              href={`/${tenant}/checkout`}
              className="block w-full text-center px-6 py-3 mt-6 text-white font-semibold rounded-lg hover:opacity-90 transition-all shadow-md hover:shadow-lg"
              style={{ backgroundColor: "var(--tenant-primary, #4F46E5)" }}
            >
              Захиалга баталгаажуулах
            </Link>
            <Link
              href={`/${tenant}/books`}
              className="block w-full text-center px-6 py-3 mt-3 font-medium hover:opacity-80 transition-colors"
              style={{ color: "var(--tenant-primary, #4F46E5)" }}
            >
              Дэлгүүр үргэлжлүүлэх
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
