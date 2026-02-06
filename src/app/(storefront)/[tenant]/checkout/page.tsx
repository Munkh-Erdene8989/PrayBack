"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { useCart } from "@/lib/tanstack/hooks/useCart";
import {
  useCreateOrder,
  useCreateQPayInvoice,
  useCheckOrderPayment,
  type QPayInvoiceData,
} from "@/lib/tanstack/hooks/useOrders";
import { useAuth } from "@/lib/auth/context";

// ---------------------------------------------------------------------------
// QPay QR Payment Modal
// ---------------------------------------------------------------------------

function QPayPaymentModal({
  invoice,
  orderId,
  tenant,
  onPaid,
  onClose,
}: {
  invoice: QPayInvoiceData["createQPayInvoice"];
  orderId: string;
  tenant: string;
  onPaid: () => void;
  onClose: () => void;
}) {
  const checkPayment = useCheckOrderPayment();
  const [polling, setPolling] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pollPayment = useCallback(async () => {
    try {
      const result = await checkPayment.mutateAsync(orderId);
      if (result.checkOrderPayment.paid) {
        setPolling(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
        onPaid();
      }
    } catch {
      // Silently continue polling
    }
  }, [checkPayment, orderId, onPaid]);

  useEffect(() => {
    if (polling) {
      intervalRef.current = setInterval(pollPayment, 3000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [polling, pollPayment]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">QPay Төлбөр</h2>
            <p className="text-sm text-gray-500 mt-0.5">QR кодыг уншуулж төлбөрөө төлнө үү</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* QR Code */}
        <div className="p-6">
          <div className="flex justify-center mb-6">
            <div className="bg-white p-4 rounded-2xl border-2 border-gray-100 shadow-sm">
              <img
                src={`data:image/png;base64,${invoice.qr_image}`}
                alt="QPay QR Code"
                className="w-52 h-52"
              />
            </div>
          </div>

          {/* Polling status */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {polling ? (
              <>
                <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full animate-pulse" />
                <span className="text-sm text-gray-500">Төлбөр хүлээж байна...</span>
              </>
            ) : (
              <>
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />
                <span className="text-sm text-green-600 font-medium">Төлбөр амжилттай!</span>
              </>
            )}
          </div>

          {/* Bank app links */}
          {invoice.urls && invoice.urls.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 text-center mb-3">Эсвэл банкны апп-аар нээх:</p>
              <div className="grid grid-cols-4 gap-3">
                {invoice.urls.slice(0, 8).map((bank) => (
                  <a
                    key={bank.name}
                    href={bank.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <img src={bank.logo} alt={bank.name} className="w-10 h-10 rounded-lg" />
                    <span className="text-[10px] text-gray-600 text-center leading-tight truncate w-full">
                      {bank.description}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {invoice.qpay_short_url && (
            <div className="mt-4 text-center">
              <a
                href={invoice.qpay_short_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs underline hover:opacity-80"
                style={{ color: "var(--tenant-primary, #4F46E5)" }}
              >
                QPay линкээр нээх
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 pt-0">
          <Link
            href={`/${tenant}/orders`}
            className="block w-full text-center px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Захиалгууд руу очих
          </Link>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Checkout Page
// ---------------------------------------------------------------------------

export default function CheckoutPage() {
  const params = useParams<{ tenant: string }>();
  const router = useRouter();
  const tenant = params.tenant;
  const { items, totalAmount, clearCart } = useCart();
  const createOrder = useCreateOrder();
  const createInvoice = useCreateQPayInvoice();
  const { user, loading: authLoading } = useAuth();

  const [qpayInvoice, setQpayInvoice] = useState<QPayInvoiceData["createQPayInvoice"] | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);

  const formattedTotal = new Intl.NumberFormat("mn-MN").format(totalAmount);

  const handlePlaceOrder = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    setOrderError(null);

    try {
      const orderItems = items.map((item) => ({
        book_id: item.book.id,
        quantity: item.quantity,
      }));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const orderResult: any = await createOrder.mutateAsync(orderItems);
      const orderId = orderResult.createOrder.id;
      setCurrentOrderId(orderId);

      const invoiceResult = await createInvoice.mutateAsync(orderId);
      setQpayInvoice(invoiceResult.createQPayInvoice);

      clearCart.mutate();
    } catch (err) {
      console.error("Order/payment creation failed:", err);
      setOrderError(err instanceof Error ? err.message : "Алдаа гарлаа. Дахин оролдоно уу.");
    }
  };

  const handlePaymentComplete = () => {
    router.push(`/${tenant}/orders`);
  };

  const handleCloseModal = () => {
    setQpayInvoice(null);
    router.push(`/${tenant}/orders`);
  };

  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-48 mx-auto" />
          <div className="h-4 bg-gray-200 rounded w-64 mx-auto" />
        </div>
      </div>
    );
  }

  if (items.length === 0 && !qpayInvoice) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={0.8} stroke="currentColor" className="w-10 h-10 text-gray-300">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Сагс хоосон байна</h2>
        <p className="text-gray-500 mb-6">Захиалга хийхийн тулд эхлээд сагсандаа ном нэмнэ үү.</p>
        <Link
          href={`/${tenant}/books`}
          className="inline-flex items-center px-6 py-3 text-white font-semibold rounded-lg hover:opacity-90 transition-all"
          style={{ backgroundColor: "var(--tenant-primary, #4F46E5)" }}
        >
          Номнууд үзэх
        </Link>
      </div>
    );
  }

  const isPending = createOrder.isPending || createInvoice.isPending;

  return (
    <>
      {qpayInvoice && currentOrderId && (
        <QPayPaymentModal
          invoice={qpayInvoice}
          orderId={currentOrderId}
          tenant={tenant}
          onPaid={handlePaymentComplete}
          onClose={handleCloseModal}
        />
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-400 mb-6">
          <Link href={`/${tenant}`} className="hover:text-gray-600 transition-colors">Нүүр</Link>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
          <Link href={`/${tenant}/cart`} className="hover:text-gray-600 transition-colors">Сагс</Link>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
          <span className="text-gray-600">Баталгаажуулах</span>
        </nav>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-8">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-green-500 text-white text-xs font-bold flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </span>
            <span className="text-sm font-medium text-gray-900">Сагс</span>
          </div>
          <div className="flex-1 h-px bg-gray-200" />
          <div className="flex items-center gap-2">
            <span
              className="w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center"
              style={{ backgroundColor: "var(--tenant-primary, #4F46E5)" }}
            >
              2
            </span>
            <span className="text-sm font-medium text-gray-900">Баталгаажуулах</span>
          </div>
          <div className="flex-1 h-px bg-gray-200" />
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-gray-200 text-gray-500 text-xs font-bold flex items-center justify-center">3</span>
            <span className="text-sm text-gray-400">Төлбөр</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-8">Захиалга баталгаажуулах</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
              {items.map((item) => {
                const itemTotal = new Intl.NumberFormat("mn-MN").format(item.book.price * item.quantity);

                return (
                  <div key={item.book.id} className="p-4 flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-16 rounded-lg bg-gray-50 overflow-hidden border border-gray-100">
                      {item.book.cover_image_url ? (
                        <img src={item.book.cover_image_url} alt={item.book.title} className="w-full h-full object-cover" />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{ background: `color-mix(in srgb, var(--tenant-primary, #4F46E5) 5%, white)` }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-6 h-6 text-gray-300">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.book.title}</p>
                      <p className="text-xs text-gray-400">{item.quantity} ширхэг</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{itemTotal}₮</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm sticky top-24">
              <h2 className="font-bold text-gray-900 mb-4">Захиалгын мэдээлэл</h2>

              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Номны тоо</dt>
                  <dd className="font-medium text-gray-900">{items.reduce((s, i) => s + i.quantity, 0)} ширхэг</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Хүргэлт</dt>
                  <dd className="font-medium text-green-600">Үнэгүй</dd>
                </div>
                <div className="flex justify-between border-t border-gray-100 pt-3">
                  <dt className="font-bold text-gray-900">Нийт дүн</dt>
                  <dd
                    className="font-extrabold text-xl"
                    style={{ color: "var(--tenant-primary, #4F46E5)" }}
                  >
                    {formattedTotal}₮
                  </dd>
                </div>
              </dl>

              {!user && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-800">Захиалга хийхийн тулд эхлээд нэвтэрнэ үү.</p>
                </div>
              )}

              <button
                onClick={handlePlaceOrder}
                disabled={isPending}
                className="w-full mt-6 px-6 py-3 text-white font-semibold rounded-lg hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                style={{ backgroundColor: "var(--tenant-primary, #4F46E5)" }}
              >
                {isPending
                  ? createOrder.isPending
                    ? "Захиалга үүсгэж байна..."
                    : "QPay нэхэмжлэл үүсгэж байна..."
                  : user
                    ? "Захиалга өгөх & Төлбөр төлөх"
                    : "Нэвтрэх"}
              </button>

              {(createOrder.isError || createInvoice.isError || orderError) && (
                <p className="mt-3 text-xs text-red-600 text-center">
                  {orderError ?? "Алдаа гарлаа. Дахин оролдоно уу."}
                </p>
              )}

              <Link
                href={`/${tenant}/cart`}
                className="block text-center text-sm mt-4 hover:opacity-80"
                style={{ color: "var(--tenant-primary, #4F46E5)" }}
              >
                Сагс руу буцах
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
