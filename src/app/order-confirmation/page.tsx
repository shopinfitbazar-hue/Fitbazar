"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/lib/LanguageContext";
import { useToast } from "@/lib/ToastContext";
import { formatPriceNpr } from "@/lib/catalog";
import { ArrowRight, CheckCircle, Copy, Home, Package, Truck } from "lucide-react";

type CustomerOrder = {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  deliveryAddress?: {
    line1?: string;
    zone?: string;
    district?: string;
    pincode?: string;
    phone?: string;
    name?: string;
  };
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    product: {
      name: string;
    };
  }>;
};

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { t } = useLanguage();
  const { addToast } = useToast();
  const orderNumber = searchParams?.get("order") || "FB-ORDER";
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function loadOrder() {
      try {
        const response = await fetch("/api/orders", {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await response.json();
        if (response.ok) {
          const matchedOrder = (data.orders || []).find((item: CustomerOrder) => item.orderNumber === orderNumber) || null;
          setOrder(matchedOrder);
        }
      } catch {
        setOrder(null);
      } finally {
        setLoading(false);
      }
    }

    void loadOrder();

    return () => controller.abort();
  }, [orderNumber, session?.user]);

  const orderSteps = useMemo(
    () => [
      { icon: CheckCircle, label: t("pending"), completed: true },
      { icon: Package, label: t("processing"), completed: order?.status !== "PENDING" ? true : false },
      { icon: Truck, label: t("shipped"), completed: order?.status === "HANDED_TO_DELIVERY" || order?.status === "DELIVERED" },
      { icon: Home, label: t("delivered"), completed: order?.status === "DELIVERED" },
    ],
    [order?.status, t],
  );

  const deliveryAddress = [
    order?.deliveryAddress?.name,
    order?.deliveryAddress?.phone,
    order?.deliveryAddress?.line1,
    order?.deliveryAddress?.district,
    order?.deliveryAddress?.zone,
    order?.deliveryAddress?.pincode,
  ]
    .filter(Boolean)
    .join(", ");

  const copyOrderNumber = async () => {
    try {
      await navigator.clipboard.writeText(orderNumber);
      addToast(t("copied"), "success");
    } catch {
      addToast(orderNumber, "info");
    }
  };

  return (
    <main className="bg-page">
      <Header />

      <div className="container py-8 md:py-10">
        <div className="mx-auto max-w-[860px]">
          <div className="rounded-[8px] bg-card p-8 text-center shadow-[var(--shadow-sm)]">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--green-bg)]">
              <CheckCircle className="h-10 w-10 text-success" />
            </div>
            <h1>{t("order_confirmed")}</h1>
            <p className="mt-2 text-[16px] text-text-secondary">{t("thank_you_purchase")}</p>
            <p className="mt-1 text-[13px] text-text-muted">{t("confirmation_email_sent")}</p>
          </div>

          <div className="mt-4 rounded-[8px] bg-card p-6 shadow-[var(--shadow-sm)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[12px] uppercase tracking-[1px] text-text-muted">{t("order_number")}</p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="text-[24px] font-bold text-fb-pink">{orderNumber}</span>
                  <button
                    type="button"
                    onClick={copyOrderNumber}
                    className="rounded-full border border-border-light p-2 text-text-muted hover:border-fb-pink hover:text-fb-pink"
                    aria-label={t("copy_order_number")}
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="rounded-[8px] bg-[var(--bg-surface)] px-4 py-3 text-[13px] text-text-secondary">
                <span className="font-semibold text-text-primary">{t("estimated_delivery")}:</span> {t("generic_estimated_delivery")}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-[8px] bg-card p-6 shadow-[var(--shadow-sm)]">
            <h2 className="mb-5">{t("order_status_title")}</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {orderSteps.map((step) => (
                <div key={step.label} className="text-center">
                  <div
                    className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${
                      step.completed ? "bg-fb-pink text-white" : "bg-[var(--bg-surface)] text-text-muted"
                    }`}
                  >
                    <step.icon className="h-5 w-5" />
                  </div>
                  <p className={`mt-2 text-[12px] font-semibold ${step.completed ? "text-fb-pink" : "text-text-muted"}`}>{step.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-[8px] bg-card p-6 shadow-[var(--shadow-sm)]">
              <h3 className="mb-4 text-[16px] font-semibold text-text-primary">{t("order_items")}</h3>
              {loading ? (
                <p className="text-[14px] text-text-muted">{t("order_lookup_pending")}</p>
              ) : order?.items?.length ? (
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-4 text-[14px]">
                      <div>
                        <p className="font-medium text-text-primary">{item.product.name}</p>
                        <p className="text-[12px] text-text-muted">{t("qty")}: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-text-primary">{formatPriceNpr(item.price * item.quantity)}</p>
                    </div>
                  ))}
                  <div className="border-t border-border-light pt-4 text-[15px] font-bold text-text-primary">
                    <div className="flex items-center justify-between">
                      <span>{t("total")}</span>
                      <span>{formatPriceNpr(order.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-[14px] text-text-muted">{t("order_summary_unavailable")}</p>
              )}
            </div>

            <div className="rounded-[8px] bg-card p-6 shadow-[var(--shadow-sm)]">
              <h3 className="mb-4 text-[16px] font-semibold text-text-primary">{t("delivery_information")}</h3>
              <div className="space-y-3 text-[14px]">
                <div>
                  <p className="text-text-muted">{t("payment_method_label")}</p>
                  <p className="font-medium text-text-primary">{order?.paymentMethod || "KHALTI"}</p>
                </div>
                <div>
                  <p className="text-text-muted">{t("delivery_address_label")}</p>
                  <p className="font-medium text-text-primary">{deliveryAddress || t("order_summary_unavailable")}</p>
                </div>
                <div>
                  <p className="text-text-muted">{t("order_date")}</p>
                  <p className="font-medium text-text-primary">
                    {order?.createdAt ? new Date(order.createdAt).toLocaleDateString("en-NP", { year: "numeric", month: "long", day: "numeric" }) : new Date().toLocaleDateString("en-NP")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/account/orders" className="btn-primary flex items-center justify-center gap-2">
              {t("track_order")}
              <ArrowRight className="h-4 w-4 text-white" />
            </Link>
            <Link href="/products" className="btn-ghost flex items-center justify-center gap-2">
              {t("continue_shopping")}
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense>
      <OrderConfirmationContent />
    </Suspense>
  );
}
