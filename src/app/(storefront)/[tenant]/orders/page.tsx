"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  useOrders,
  useCreateQPayInvoice,
  useCheckOrderPayment,
  type QPayInvoiceData,
} from "@/lib/tanstack/hooks/useOrders";
import { useAuth } from "@/lib/auth/context";
import type { OrderStatus, PaymentStatus } from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Хүлээгдэж буй",
  paid: "Төлөгдсөн",
  shipped: "Илгээсэн",
  delivered: "Хүргэгдсэн",
  cancelled: "Цуцлагдсан",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  paid: "bg-green-50 text-green-700 border-green-200",
  shipped: "bg-blue-50 text-blue-700 border-blue-200",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  unpaid: "Төлөгдөөгүй",
  paid: "Төлөгдсөн",
  refunded: "Буцаагдсан",
};

const PAYMENT_COLORS: Record<PaymentStatus, string> = {
  unpaid: "text-yellow-600",
  paid: "text-green-600",
  refunded: "text-gray-500",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// QPay Payment Modal
// ---------------------------------------------------------------------------

function QPayPaymentModal({
  invoice,
  orderId,
  onPaid,
  onClose,
}: {
  invoice: QPayInvoiceData["createQPayInvoice"];
  orderId: string;
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
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">QPay Төлбөр</h2>
            <p className="text-sm text-gray-500 mt-0.5">QR кодыг уншуулж төлбөрөө төлнө үү</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div className="flex justify-center mb-6">
            <div className="bg-white p-4 rounded-2xl border-2 border-gray-100 shadow-sm">
              <img src={`data:image/png;base64,${invoice.qr_image}`} alt="QPay QR Code" className="w-52 h-52" />
            </div>
          </div>

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

          {invoice.urls && invoice.urls.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 text-center mb-3">Эсвэл банкны апп-аар нээх:</p>
              <div className="grid grid-cols-4 gap-3">
                {invoice.urls.slice(0, 8).map((bank) => (
                  <a key={bank.name} href={bank.link} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <img src={bank.logo} alt={bank.name} className="w-10 h-10 rounded-lg" />
                    <span className="text-[10px] text-gray-600 text-center leading-tight truncate w-full">{bank.description}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {invoice.qpay_short_url && (
            <div className="mt-4 text-center">
              <a href={invoice.qpay_short_url} target="_blank" rel="noopener noreferrer" className="text-xs underline hover:opacity-80" style={{ color: "var(--tenant-primary, #4F46E5)" }}>
                QPay линкээр нээх
              </a>
            </div>
          )}
        </div>

        <div className="p-6 pt-0">
          <button onClick={onClose} className="block w-full text-center px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Хаах</button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Order type for this page
// ---------------------------------------------------------------------------

interface OrderRow {
  id: string;
  status: OrderStatus;
  total_amount: number;
  payment_status: PaymentStatus;
  qpay_invoice_id: string | null;
  created_at: string;
  items: Array<{
    id: string;
    quantity: number;
    unit_price: number;
    book: {
      id: string;
      title: string;
      cover_image_url: string | null;
    };
  }>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function OrdersPage() {
  const params = useParams<{ tenant: string }>();
  const tenant = params.tenant;
  const { user, loading: authLoading } = useAuth();
  const { data: ordersData, isLoading, refetch } = useOrders();
  const createInvoice = useCreateQPayInvoice();

  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
  const [qpayInvoice, setQpayInvoice] = useState<QPayInvoiceData["createQPayInvoice"] | null>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orders: OrderRow[] = (ordersData as any)?.orders ?? [];

  const handlePayOrder = async (orderId: string) => {
    setInvoiceLoading(true);
    setPayingOrderId(orderId);
    try {
      const result = await createInvoice.mutateAsync(orderId);
      setQpayInvoice(result.createQPayInvoice);
    } catch (err) {
      console.error("Failed to create QPay invoice:", err);
      setPayingOrderId(null);
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handlePaymentComplete = () => {
    setQpayInvoice(null);
    setPayingOrderId(null);
    refetch();
  };

  const handleCloseModal = () => {
    setQpayInvoice(null);
    setPayingOrderId(null);
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

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-10 h-10 text-gray-300">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Нэвтрэх шаардлагатай</h2>
        <p className="text-gray-500 mb-6">Захиалгын түүхээ харахын тулд эхлээд нэвтэрнэ үү.</p>
        <Link
          href="/login"
          className="inline-flex items-center px-6 py-3 text-white font-semibold rounded-lg hover:opacity-90 transition-all"
          style={{ backgroundColor: "var(--tenant-primary, #4F46E5)" }}
        >
          Нэвтрэх
        </Link>
      </div>
    );
  }

  return (
    <>
      {qpayInvoice && payingOrderId && (
        <QPayPaymentModal
          invoice={qpayInvoice}
          orderId={payingOrderId}
          onPaid={handlePaymentComplete}
          onClose={handleCloseModal}
        />
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-400 mb-6">
          <Link href={`/${tenant}`} className="hover:text-gray-600 transition-colors">Нүүр</Link>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
          <span className="text-gray-600">Захиалгууд</span>
        </nav>

        <h1 className="text-2xl font-bold text-gray-900 mb-8">Захиалгын түүх</h1>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse shadow-sm">
                <div className="flex justify-between mb-4">
                  <div className="h-4 bg-gray-200 rounded w-32" />
                  <div className="h-5 bg-gray-200 rounded w-24" />
                </div>
                <div className="h-4 bg-gray-200 rounded w-48 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-36" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-8 h-8 text-gray-300">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Захиалга байхгүй</h2>
            <p className="text-gray-500 mb-6">Та одоогоор захиалга хийгээгүй байна.</p>
            <Link
              href={`/${tenant}/books`}
              className="inline-flex items-center px-6 py-3 text-white font-semibold rounded-lg hover:opacity-90 transition-all"
              style={{ backgroundColor: "var(--tenant-primary, #4F46E5)" }}
            >
              Номнууд үзэх
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const formattedAmount = new Intl.NumberFormat("mn-MN").format(order.total_amount);
              const canPay = order.status === "pending" && order.payment_status === "unpaid";

              return (
                <div key={order.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {/* Order header */}
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50 border-b border-gray-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-400">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                        </svg>
                        <p className="text-sm font-medium text-gray-700">#{order.id.slice(0, 8)}</p>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{formatDate(order.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full border ${STATUS_COLORS[order.status]}`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                      <span className={`text-xs font-medium ${PAYMENT_COLORS[order.payment_status]}`}>
                        {PAYMENT_LABELS[order.payment_status]}
                      </span>
                    </div>
                  </div>

                  {/* Order items */}
                  <div className="p-4 sm:p-5">
                    <div className="space-y-3">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-10 h-14 rounded-lg bg-gray-50 overflow-hidden border border-gray-100">
                            {item.book.cover_image_url ? (
                              <img src={item.book.cover_image_url} alt={item.book.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center" style={{ background: `color-mix(in srgb, var(--tenant-primary, #4F46E5) 5%, white)` }}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-5 h-5 text-gray-300">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{item.book.title}</p>
                            <p className="text-xs text-gray-400">
                              {item.quantity} ширхэг × {new Intl.NumberFormat("mn-MN").format(item.unit_price)}₮
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      <span className="text-sm text-gray-500">Нийт дүн</span>
                      <span
                        className="text-lg font-bold"
                        style={{ color: "var(--tenant-primary, #4F46E5)" }}
                      >
                        {formattedAmount}₮
                      </span>
                    </div>

                    {canPay && (
                      <div className="mt-4">
                        <button
                          onClick={() => handlePayOrder(order.id)}
                          disabled={invoiceLoading && payingOrderId === order.id}
                          className="w-full px-4 py-2.5 text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
                          style={{ backgroundColor: "var(--tenant-primary, #4F46E5)" }}
                        >
                          {invoiceLoading && payingOrderId === order.id ? (
                            <>
                              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              QPay нэхэмжлэл үүсгэж байна...
                            </>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                              </svg>
                              QPay-ээр төлөх
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
