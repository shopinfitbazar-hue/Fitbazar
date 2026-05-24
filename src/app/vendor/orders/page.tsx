"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import { Search, Package, Truck, CheckCircle, Clock, XCircle } from "lucide-react";
import { formatPriceNpr } from "@/lib/catalog";
import { useLanguage } from "@/lib/LanguageContext";
import VendorSidebar from "@/components/VendorSidebar";

type VendorOrder = {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  deliveryAddress: {
    line1?: string;
    zone?: string;
    district?: string;
  };
  customer: {
    name: string | null;
    phone: string | null;
    email: string;
  };
  items: Array<{
    id: string;
    quantity: number;
    product: {
      name: string;
    };
  }>;
};

type VendorOrdersResponse = {
  orders: VendorOrder[];
  vendor?: {
    shopName: string;
    isApproved: boolean;
    isSuspended: boolean;
  };
};

const statusOptions = ["PENDING", "RECEIVED", "PACKED", "HANDED_TO_DELIVERY", "DELIVERED", "CANCELLED"];

export default function VendorOrdersPage() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [vendorMeta, setVendorMeta] = useState<VendorOrdersResponse["vendor"] | null>(null);

  useEffect(() => {
    async function loadOrders() {
      const response = await fetch(`/api/vendor/orders?status=${encodeURIComponent(statusFilter)}&q=${encodeURIComponent(deferredSearchQuery)}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as VendorOrdersResponse;
      if (response.ok) {
        setOrders(data.orders || []);
        setVendorMeta(data.vendor || null);
      }
    }

    void loadOrders();
  }, [deferredSearchQuery, statusFilter]);

  const getStatusConfig = useMemo(
    () => (status: string) => {
      switch (status) {
        case "PENDING": return { icon: Clock, color: "text-fb-orange bg-[var(--amber-bg)]", label: t("pending") };
        case "RECEIVED": return { icon: Package, color: "text-text-secondary bg-[var(--bg-surface)]", label: t("received") };
        case "PACKED": return { icon: Package, color: "text-fb-pink bg-fb-pink-bg", label: t("packed") };
        case "HANDED_TO_DELIVERY": return { icon: Truck, color: "text-fb-pink bg-fb-pink-bg", label: t("in_transit") };
        case "DELIVERED": return { icon: CheckCircle, color: "text-success bg-[var(--green-bg)]", label: t("delivered") };
        case "CANCELLED": return { icon: XCircle, color: "text-fb-pink bg-fb-pink-bg", label: t("cancelled") };
        default: return { icon: Clock, color: "text-text-secondary bg-[var(--bg-surface)]", label: status };
      }
    },
    [t],
  );

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const response = await fetch(`/api/vendor/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const data = await response.json();
    if (!response.ok) return;

    setOrders((current) =>
      current.map((order) => (order.id === orderId ? { ...order, status: data.order.status } : order)),
    );
  };

  return (
    <main className="bg-page">
      <Header />
      <div className="mx-auto flex max-w-site">
        <VendorSidebar
          shopName={vendorMeta?.shopName}
          isApproved={vendorMeta?.isApproved}
          isSuspended={vendorMeta?.isSuspended}
          subtitle={t("orders")}
        />
        <section className="flex-1 p-4 md:p-6">
        <h1 className="mb-8">{t("orders")}</h1>

        <div className="mb-6 flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={t("search_orders")}
              className="pl-12"
            />
          </div>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="max-w-[220px]">
            <option value="ALL">{t("all_status")}</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          {orders.map((order) => {
            const status = getStatusConfig(order.status);

            return (
              <div key={order.id} className="overflow-hidden rounded-[8px] bg-card shadow-[var(--shadow-sm)]">
                <div className="p-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-fb-pink-bg">
                        <status.icon className="h-6 w-6 text-fb-pink" />
                      </div>
                      <div>
                        <h3 className="text-[18px] font-semibold text-text-primary">{order.orderNumber}</h3>
                        <p className="text-sm text-text-muted">{new Date(order.createdAt).toLocaleDateString("en-NP")}</p>
                      </div>
                    </div>

                    <div className="flex-1 md:px-8">
                      <p className="font-medium text-text-primary">{order.customer.name || t("customer")}</p>
                      <p className="text-sm text-text-muted">{order.items[0]?.product.name || t("products")} × {order.items[0]?.quantity || 0}</p>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${status.color}`}>
                        {status.label}
                      </span>
                      <span className="text-lg font-bold text-text-primary">{formatPriceNpr(order.totalAmount)}</span>
                    </div>

                    <button onClick={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)} className="text-sm font-semibold text-fb-pink hover:underline">
                      {selectedOrder === order.id ? t("hide_details") : t("view_details")}
                    </button>
                  </div>
                </div>

                {selectedOrder === order.id ? (
                  <div className="border-t border-border-light bg-[var(--bg-surface)] p-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <h4 className="mb-3 font-semibold text-text-primary">{t("customer_information")}</h4>
                        <p className="text-sm text-text-secondary"><span className="text-text-muted">{t("name")}:</span> {order.customer.name || t("customer")}</p>
                        <p className="text-sm text-text-secondary"><span className="text-text-muted">{t("phone_number")}:</span> {order.customer.phone || t("not_available")}</p>
                        <p className="text-sm text-text-secondary"><span className="text-text-muted">{t("address")}:</span> {[order.deliveryAddress?.line1, order.deliveryAddress?.district, order.deliveryAddress?.zone].filter(Boolean).join(", ")}</p>
                      </div>

                      <div>
                        <h4 className="mb-3 font-semibold text-text-primary">{t("update_status")}</h4>
                        <div className="flex flex-wrap gap-2">
                          {statusOptions.map((statusOption) => (
                            <button
                              key={statusOption}
                              onClick={() => updateOrderStatus(order.id, statusOption)}
                              disabled={order.status === "CANCELLED" || order.status === "DELIVERED"}
                              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                                order.status === statusOption
                                  ? "bg-fb-pink text-white"
                                  : "border border-border-default bg-card hover:border-fb-pink"
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {statusOption}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        {orders.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="mx-auto mb-4 h-16 w-16 text-text-muted" />
            <h3 className="text-xl font-semibold text-text-primary">{t("no_orders_found")}</h3>
            <p className="text-text-muted">{t("adjust_search_filters")}</p>
          </div>
        ) : null}
        </section>
      </div>
    </main>
  );
}
