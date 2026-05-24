"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CircleDollarSign, Package, ShoppingBag, Star } from "lucide-react";
import Header from "@/components/Header";
import VendorSidebar from "@/components/VendorSidebar";
import { formatPriceNpr } from "@/lib/catalog";
import { useLanguage } from "@/lib/LanguageContext";

interface VendorStatsResponse {
  vendor: {
    id: string;
    shopName: string;
    slug: string;
    isApproved: boolean;
    isSuspended: boolean;
  };
  stats: {
    todaysRevenue: number;
    ordersToday: number;
    pendingOrders: number;
    avgRating: number;
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    totalAmount: number;
    status: string;
    createdAt: string;
    customer: {
      name: string | null;
    };
    items: Array<{
      id: string;
      product: {
        name: string;
      };
    }>;
  }>;
  recentReviews?: Array<{
    id: string;
    rating: number;
    comment: string | null;
    isVisible: boolean;
    createdAt: string;
    user: {
      name: string | null;
    };
  }>;
}

export default function VendorDashboard() {
  const { t } = useLanguage();
  const [data, setData] = useState<VendorStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      try {
        const response = await fetch("/api/vendor/stats", { cache: "no-store" });
        const result = await response.json();
        if (response.ok) {
          setData(result);
          setError("");
        } else {
          setError(result.error || t("vendor_access_unavailable"));
        }
      } finally {
        setLoading(false);
      }
    }

    void loadStats();
  }, [t]);

  const stats = [
    { label: t("todays_revenue"), value: formatPriceNpr(data?.stats.todaysRevenue || 0), icon: CircleDollarSign, tone: "text-fb-pink" },
    { label: t("orders_today"), value: String(data?.stats.ordersToday || 0), icon: ShoppingBag, tone: "text-success" },
    { label: t("pending_orders"), value: String(data?.stats.pendingOrders || 0), icon: Package, tone: "text-fb-pink" },
    { label: t("avg_rating"), value: (data?.stats.avgRating || 0).toFixed(1), icon: Star, tone: "text-success" },
  ];

  return (
    <main className="bg-page">
      <Header />
      <div className="mx-auto flex max-w-site">
        <VendorSidebar
          shopName={data?.vendor.shopName}
          isApproved={data?.vendor.isApproved}
          isSuspended={data?.vendor.isSuspended}
        />

        <section className="flex-1 p-4 md:p-6">
          {error ? (
            <div className="mb-4 rounded-[8px] border border-border-light bg-card p-5">
              <h2 className="text-[18px] font-semibold text-text-primary">{t("vendor_access_unavailable")}</h2>
              <p className="mt-2 text-[14px] text-text-secondary">{error}</p>
            </div>
          ) : null}

          {data && (!data.vendor.isApproved || data.vendor.isSuspended) ? (
            <div className="mb-4 rounded-[8px] border border-border-light bg-card p-5">
              <h2 className="text-[18px] font-semibold text-text-primary">
                {data.vendor.isSuspended ? t("vendor_store_suspended") : t("vendor_store_pending")}
              </h2>
              <p className="mt-2 text-[14px] text-text-secondary">
                {data.vendor.isSuspended
                  ? t("suspended_vendor_note")
                  : t("pending_vendor_note")}
              </p>
            </div>
          ) : null}

          <div className="rounded-[8px] bg-card p-5">
            <h2 className="text-[20px] font-semibold text-text-primary">{t("vendor_welcome")}, {data?.vendor.shopName || t("vendors")} 👋</h2>
            <p className="mt-1 text-[13px] text-text-muted">{new Date().toLocaleDateString("en-NP", { weekday: "long", month: "long", day: "numeric" })}</p>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-[8px] border border-border-light bg-card p-5 shadow-[var(--shadow-sm)]">
                <div className="flex items-center gap-3">
                  <stat.icon className={`h-6 w-6 ${stat.tone}`} />
                  <span className="text-[12px] uppercase tracking-[1px] text-text-muted">{stat.label}</span>
                </div>
                <div className="mt-4 text-[28px] font-bold text-text-primary">{loading ? "..." : stat.value}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-[8px] bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[16px] font-semibold text-text-primary">{t("recent_orders")}</h3>
              <Link href="/vendor/orders" className="text-[13px] font-semibold uppercase text-fb-pink">
                {t("view_all")}
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-border-light text-left text-[12px] uppercase tracking-[1px] text-text-muted">
                    <th className="py-3">{t("order_number")}</th>
                    <th className="py-3">{t("customer")}</th>
                    <th className="py-3">{t("products")}</th>
                    <th className="py-3">{t("amount")}</th>
                    <th className="py-3">{t("orderStatus")}</th>
                    <th className="py-3">{t("time")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-border-light text-[13px] text-text-secondary last:border-b-0">
                      <td className="py-4 font-medium text-text-primary">{order.orderNumber}</td>
                      <td>{order.customer.name || t("customer")}</td>
                      <td>{order.items[0]?.product.name || t("products")}</td>
                      <td className="font-medium text-text-primary">{formatPriceNpr(order.totalAmount)}</td>
                      <td>
                        <span className={`badge ${order.status === "DELIVERED" ? "badge-green" : order.status === "PACKED" ? "badge-orange" : "badge-pink"}`}>
                          {order.status.replaceAll("_", " ")}
                        </span>
                      </td>
                      <td>{new Date(order.createdAt).toLocaleDateString("en-NP")}</td>
                    </tr>
                  ))}
                  {!loading && !data?.recentOrders.length ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-text-muted">{t("no_recent_orders")}</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 rounded-[8px] bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[16px] font-semibold text-text-primary">{t("vendor_reviews")}</h3>
              <Link href="/vendor/store-preview" className="text-[13px] font-semibold uppercase text-fb-pink">
                {t("store_preview")}
              </Link>
            </div>
            <div className="space-y-3">
              {data?.recentReviews?.length ? (
                data.recentReviews.map((review) => (
                  <div key={review.id} className="rounded-[8px] border border-border-light p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[14px] font-semibold text-text-primary">{review.user.name || t("customer")}</div>
                        <div className="mt-1 text-[12px] text-text-muted">{new Date(review.createdAt).toLocaleDateString("en-NP")}</div>
                      </div>
                      <span className="badge badge-green">{review.rating}/5</span>
                    </div>
                    <p className="mt-3 text-[14px] text-text-secondary">{review.comment || t("review_without_comment")}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-[8px] border border-border-light p-6 text-center text-[14px] text-text-muted">
                  {t("no_vendor_reviews_yet")}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
