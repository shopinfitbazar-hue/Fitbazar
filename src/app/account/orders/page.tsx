"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { CheckCircle, Clock, Package, Package2, Truck, XCircle } from "lucide-react";
import SmartImage from "@/components/ui/SmartImage";
import { formatPriceNpr } from "@/lib/catalog";
import { useLanguage } from "@/lib/LanguageContext";

interface OrderListItem {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  totalAmount: number;
  createdAt: string;
  vendor: {
    shopName: string;
  };
  items: Array<{
    id: string;
    quantity: number;
    size?: string | null;
    color?: string | null;
    price: number;
    product?: {
      name: string;
      images: string[];
    } | null;
  }>;
}

const statusConfig = {
  DELIVERED: { icon: CheckCircle, color: "text-success", label: "delivered", bgColor: "bg-[var(--green-bg)]" },
  HANDED_TO_DELIVERY: { icon: Truck, color: "text-fb-pink", label: "in_transit", bgColor: "bg-fb-pink-bg" },
  PACKED: { icon: Package2, color: "text-fb-orange", label: "packed", bgColor: "bg-[var(--amber-bg)]" },
  RECEIVED: { icon: Clock, color: "text-text-secondary", label: "received", bgColor: "bg-[var(--bg-surface)]" },
  PENDING: { icon: Clock, color: "text-text-secondary", label: "pending", bgColor: "bg-[var(--bg-surface)]" },
  CANCELLED: { icon: XCircle, color: "text-fb-pink", label: "cancelled", bgColor: "bg-fb-pink-bg" },
  DISPUTED: { icon: XCircle, color: "text-fb-orange", label: "disputed", bgColor: "bg-[var(--amber-bg)]" },
};

export default function OrdersPage() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      setLoading(true);
      try {
        const response = await fetch("/api/orders", { cache: "no-store" });
        const data = await response.json();
        if (response.ok) {
          setOrders(data.orders || []);
        } else {
          setOrders([]);
        }
      } finally {
        setLoading(false);
      }
    }

    void loadOrders();
  }, []);

  return (
    <main className="bg-page">
      <Header />
      <div className="container py-8">
        <div className="mb-6 flex items-center gap-2 text-sm text-text-muted">
          <Link href="/" className="hover:text-fb-pink">{t("home")}</Link>
          <span>/</span>
          <Link href="/account/dashboard" className="hover:text-fb-pink">{t("account")}</Link>
          <span>/</span>
          <span className="font-medium text-text-primary">{t("orders")}</span>
        </div>

        <h1 className="mb-8">{t("my_orders")}</h1>

        {loading ? (
          <div className="rounded-[8px] bg-card p-8 text-center">
            <p className="text-[14px] text-text-muted">{t("loading_orders")}</p>
          </div>
        ) : orders.length ? (
          <div className="space-y-4">
            {orders.map((order) => {
              const config = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.PENDING;
              const Icon = config.icon;

              return (
                <div key={order.id} className="overflow-hidden rounded-[8px] bg-card">
                  <div className="border-b border-border-light p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="mb-2 flex items-center gap-3">
                          <h2 className="text-[18px] font-semibold text-text-primary">{order.orderNumber}</h2>
                          <span className={`rounded-[20px] px-3 py-1 text-[12px] font-semibold ${config.bgColor} ${config.color}`}>
                            {t(config.label)}
                          </span>
                        </div>
                        <p className="text-[13px] text-text-muted">
                          {new Date(order.createdAt).toLocaleDateString("en-NP")} • {order.items.length} {t("items_label")} • {order.paymentMethod}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="text-[20px] font-bold text-text-primary">{formatPriceNpr(order.totalAmount)}</p>
                        <button onClick={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)} className="text-[13px] font-semibold text-fb-pink">
                          {selectedOrder === order.id ? t("hide_details") : t("view_details")}
                        </button>
                      </div>
                    </div>
                  </div>

                  {selectedOrder === order.id ? (
                    <div className="space-y-4 bg-[var(--bg-surface)] p-6">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-4">
                          <div className="relative h-16 w-16 overflow-hidden rounded-[6px] bg-card">
                            {item.product?.images?.[0] ? (
                              <SmartImage src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[12px] text-text-muted">{t("no_image")}</div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-[14px] font-medium text-text-primary">{item.product?.name || t("products")}</p>
                            <p className="text-[12px] text-text-muted">{t("qty")}: {item.quantity} • {item.size || t("free")} • {item.color || t("default_label")}</p>
                          </div>
                          <p className="text-[14px] font-bold text-text-primary">{formatPriceNpr(item.price * item.quantity)}</p>
                        </div>
                      ))}
                      <div className="rounded-[8px] border border-border-light bg-card p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${config.color}`} />
                          <span className="text-[14px] font-semibold text-text-primary">{t("current_status")}: {t(config.label)}</span>
                        </div>
                        <p className="text-[13px] text-text-muted">{t("vendor")}: {order.vendor.shopName}</p>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[8px] bg-card px-4 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--bg-surface)]">
              <Package className="h-8 w-8 text-text-muted" />
            </div>
            <h2 className="mt-4 text-[18px] font-semibold text-text-primary">{t("no_orders_yet")}</h2>
            <p className="mt-2 text-[14px] text-text-muted">{t("start_shopping_orders")}</p>
            <Link href="/products" className="btn-primary mt-5 inline-flex">
              {t("shop_now")}
            </Link>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
