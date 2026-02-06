"use client";

import { use, useState } from "react";
import {
  useAdminOrders,
  useUpdateOrderStatus,
  useAdminCancelOrder,
  type AdminOrder,
} from "@/lib/tanstack/hooks/useAdminOrders";
import { useTenant } from "@/lib/tanstack/hooks/useTenant";
import type { OrderStatus } from "@/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "Хүлээгдэж буй" },
  { value: "paid", label: "Төлсөн" },
  { value: "shipped", label: "Илгээсэн" },
  { value: "delivered", label: "Хүргэсэн" },
  { value: "cancelled", label: "Цуцалсан" },
];

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  shipped: "bg-blue-100 text-blue-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Хүлээгдэж буй",
  paid: "Төлсөн",
  shipped: "Илгээсэн",
  delivered: "Хүргэсэн",
  cancelled: "Цуцалсан",
};

const PAYMENT_LABELS: Record<string, string> = {
  unpaid: "Төлөөгүй",
  paid: "Төлсөн",
  refunded: "Буцаасан",
};

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        STATUS_STYLES[status] ?? "bg-gray-100 text-gray-800"
      }`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Order Detail Modal
// ---------------------------------------------------------------------------

function OrderDetailModal({
  order,
  onClose,
  onUpdateStatus,
  onCancel,
  isUpdating,
}: {
  order: AdminOrder;
  onClose: () => void;
  onUpdateStatus: (id: string, status: OrderStatus) => void;
  onCancel: (id: string) => void;
  isUpdating: boolean;
}) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("mn-MN").format(amount) + "₮";

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("mn-MN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  // Determine next valid statuses
  const getNextStatuses = (currentStatus: string): OrderStatus[] => {
    switch (currentStatus) {
      case "pending":
        return ["paid", "cancelled"];
      case "paid":
        return ["shipped", "cancelled"];
      case "shipped":
        return ["delivered"];
      default:
        return [];
    }
  };

  const nextStatuses = getNextStatuses(order.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Захиалга #{order.id.slice(0, 8)}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {formatDate(order.created_at)}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Status + Payment */}
          <div className="flex items-center gap-3">
            <StatusBadge status={order.status} />
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                order.payment_status === "paid"
                  ? "bg-green-100 text-green-800"
                  : order.payment_status === "refunded"
                  ? "bg-orange-100 text-orange-800"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {PAYMENT_LABELS[order.payment_status] ?? order.payment_status}
            </span>
          </div>

          {/* Customer */}
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">Хэрэглэгч</h4>
            <p className="text-sm text-gray-900">
              {order.user?.name ?? "Нэргүй"}
            </p>
            <p className="text-sm text-gray-500">{order.user?.phone ?? "—"}</p>
          </div>

          {/* Items */}
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Бүтээгдэхүүнүүд</h4>
            <div className="space-y-2">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    {item.book?.cover_image_url ? (
                      <img
                        src={item.book.cover_image_url}
                        alt={item.book.title}
                        className="w-8 h-11 rounded object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-8 h-11 rounded bg-gray-100 border border-gray-200" />
                    )}
                    <div>
                      <p className="text-sm text-gray-900">
                        {item.book?.title ?? "Устгагдсан ном"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {item.quantity} x {formatCurrency(item.unit_price)}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {formatCurrency(item.quantity * item.unit_price)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <span className="text-sm font-medium text-gray-500">Нийт дүн</span>
            <span className="text-lg font-bold text-gray-900">
              {formatCurrency(order.total_amount)}
            </span>
          </div>

          {/* Status Actions */}
          {nextStatuses.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">
                Төлөв өөрчлөх
              </h4>
              <div className="flex flex-wrap gap-2">
                {nextStatuses.map((status) =>
                  status === "cancelled" ? (
                    <button
                      key={status}
                      onClick={() => onCancel(order.id)}
                      disabled={isUpdating}
                      className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      Цуцлах
                    </button>
                  ) : (
                    <button
                      key={status}
                      onClick={() => onUpdateStatus(order.id, status)}
                      disabled={isUpdating}
                      className="px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50"
                    >
                      {STATUS_LABELS[status]}
                    </button>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

interface AdminOrdersPageProps {
  params: Promise<{ tenant: string }>;
}

export default function AdminOrdersPage({ params }: AdminOrdersPageProps) {
  const { tenant } = use(params);
  const { data: tenantData } = useTenant(tenant);
  const { data: orders, isLoading } = useAdminOrders();
  const updateOrderStatus = useUpdateOrderStatus();
  const cancelOrder = useAdminCancelOrder();

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

  // Filter orders by tenant and status
  const filteredOrders = (orders ?? []).filter((order) => {
    if (tenantData?.id && order.tenant_id !== tenantData.id) return false;
    if (filterStatus !== "all" && order.status !== filterStatus) return false;
    return true;
  });

  const handleUpdateStatus = (id: string, status: OrderStatus) => {
    updateOrderStatus.mutate(
      { id, status },
      {
        onSuccess: () => setSelectedOrder(null),
      }
    );
  };

  const handleCancel = (id: string) => {
    cancelOrder.mutate(id, {
      onSuccess: () => setSelectedOrder(null),
    });
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("mn-MN").format(amount) + "₮";

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("mn-MN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  // Count orders by status
  const allTenantOrders = (orders ?? []).filter(
    (o) => !tenantData?.id || o.tenant_id === tenantData.id
  );
  const statusCounts: Record<string, number> = { all: allTenantOrders.length };
  for (const o of allTenantOrders) {
    statusCounts[o.status] = (statusCounts[o.status] ?? 0) + 1;
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Захиалгууд</h1>
        <p className="text-sm text-gray-500 mt-1">
          Захиалгуудыг удирдах — төлөв өөрчлөх, дэлгэрэнгүй харах
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[{ value: "all", label: "Бүгд" }, ...STATUS_OPTIONS].map(
          ({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilterStatus(value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === value
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {label}
              {statusCounts[value] !== undefined && (
                <span
                  className={`ml-1.5 text-xs ${
                    filterStatus === value
                      ? "text-indigo-200"
                      : "text-gray-400"
                  }`}
                >
                  ({statusCounts[value]})
                </span>
              )}
            </button>
          )
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-12 h-12 mx-auto text-gray-300 mb-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
            </svg>
            <p className="text-gray-500 text-sm">Захиалга олдсонгүй</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                  <th className="px-6 py-3">Захиалга</th>
                  <th className="px-6 py-3">Хэрэглэгч</th>
                  <th className="px-6 py-3">Бүтээгдэхүүн</th>
                  <th className="px-6 py-3">Дүн</th>
                  <th className="px-6 py-3">Төлөв</th>
                  <th className="px-6 py-3">Төлбөр</th>
                  <th className="px-6 py-3">Огноо</th>
                  <th className="px-6 py-3 text-right">Үйлдэл</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono text-gray-900">
                        #{order.id.slice(0, 8)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-gray-900">
                          {order.user?.name ?? "Нэргүй"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {order.user?.phone ?? "—"}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">
                        {order.items.length} бүтээгдэхүүн
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {formatCurrency(order.total_amount)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          order.payment_status === "paid"
                            ? "bg-green-100 text-green-800"
                            : order.payment_status === "refunded"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {PAYMENT_LABELS[order.payment_status] ??
                          order.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                        Дэлгэрэнгүй
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={handleUpdateStatus}
          onCancel={handleCancel}
          isUpdating={updateOrderStatus.isPending || cancelOrder.isPending}
        />
      )}
    </div>
  );
}
