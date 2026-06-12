"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { CheckCircle, Clock, FileText, Package, Package2, Printer, Truck, XCircle } from "lucide-react";
import SmartImage from "@/components/ui/SmartImage";
import { formatPriceNpr } from "@/lib/catalog";
import { useLanguage } from "@/lib/LanguageContext";

interface DeliveryAddress {
  name?: string;
  email?: string;
  phone?: string;
  line1?: string;
  zone?: string;
  district?: string;
  pincode?: string;
  deliveryMethod?: string;
  shippingAmount?: number;
  couponDiscount?: number;
  paymentReference?: string;
}

interface OrderListItem {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  totalAmount: number;
  createdAt: string;
  deliveryAddress?: DeliveryAddress;
  vendor: {
    shopName: string;
    slug?: string | null;
    logo?: string | null;
    address?: string | null;
    zone?: string | null;
    district?: string | null;
    phone?: string | null;
    panNumber?: string | null;
  };
  items: Array<{
    id: string;
    quantity: number;
    size?: string | null;
    color?: string | null;
    price: number;
    product?: {
      id: string;
      slug?: string | null;
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

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-NP", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function initials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "FB";
}

function addressLine(parts: Array<string | null | undefined>) {
  return parts.filter(Boolean).join(", ");
}

function OrderInvoice({ order }: { order: OrderListItem }) {
  const { t } = useLanguage();
  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = Number(order.deliveryAddress?.shippingAmount || 0);
  const discount = Number(order.deliveryAddress?.couponDiscount || 0);
  const tax = 0;
  const total = order.totalAmount || subtotal - discount + shipping + tax;
  const deliveryAddress = order.deliveryAddress;
  const storeAddress = addressLine([order.vendor.address, order.vendor.district, order.vendor.zone]);
  const customerAddress = addressLine([
    deliveryAddress?.line1,
    deliveryAddress?.district,
    deliveryAddress?.zone,
    deliveryAddress?.pincode,
  ]);

  return (
    <section className="account-invoice-print rounded-[8px] border border-border-light bg-card p-4 shadow-[var(--shadow-sm)] sm:p-6 lg:p-8">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr_1fr] lg:items-start">
        <div className="rounded-[8px] bg-[var(--bg-surface)] p-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-light bg-card text-[16px] font-bold text-fb-pink">
              {order.vendor.logo ? (
                <SmartImage src={order.vendor.logo} alt={order.vendor.shopName} fill className="object-cover" />
              ) : (
                initials(order.vendor.shopName)
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">Store</p>
              <h3 className="truncate text-[18px] font-bold text-text-primary">{order.vendor.shopName}</h3>
            </div>
          </div>
          <div className="space-y-1 text-[13px] text-text-secondary">
            <p>Bill No. <span className="font-semibold text-text-primary">{order.orderNumber}</span></p>
            <p>Order Date <span className="font-semibold text-text-primary">{formatDateTime(order.createdAt)}</span></p>
            <p>Payment <span className="font-semibold text-text-primary">{order.paymentMethod}</span></p>
            {storeAddress ? <p>{storeAddress}</p> : null}
            {order.vendor.phone ? <p>Phone {order.vendor.phone}</p> : null}
            {order.vendor.panNumber ? <p>PAN {order.vendor.panNumber}</p> : null}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="border-b border-border-light pb-3 text-[18px] font-bold text-text-primary">Bill To</h3>
          <div className="space-y-1 text-[14px] text-text-secondary">
            <p className="font-semibold text-text-primary">{deliveryAddress?.name || t("customer")}</p>
            {deliveryAddress?.email ? <p>{deliveryAddress.email}</p> : null}
            {deliveryAddress?.phone ? <p>{deliveryAddress.phone}</p> : null}
            {customerAddress ? <p>{customerAddress}</p> : <p>{t("not_available")}</p>}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="border-b border-border-light pb-3 text-[18px] font-bold text-text-primary">Ship To</h3>
          <div className="space-y-1 text-[14px] text-text-secondary">
            <p className="font-semibold text-text-primary">{deliveryAddress?.name || t("customer")}</p>
            {customerAddress ? <p>{customerAddress}</p> : <p>{t("not_available")}</p>}
            {deliveryAddress?.phone ? <p>{deliveryAddress.phone}</p> : null}
            {deliveryAddress?.deliveryMethod ? <p className="capitalize">{deliveryAddress.deliveryMethod} delivery</p> : null}
          </div>
        </div>
      </div>

      <div className="mt-6 hidden overflow-hidden rounded-[8px] border border-border-light md:block">
        <div className="grid grid-cols-[1.5fr_0.45fr_0.65fr_0.75fr] bg-[var(--bg-surface)] px-4 py-3 text-[12px] font-bold uppercase tracking-[0.08em] text-text-muted">
          <span>Item Description</span>
          <span className="text-center">Qty</span>
          <span className="text-right">Price</span>
          <span className="text-right">Item Total</span>
        </div>
        <div className="divide-y divide-border-light">
          {order.items.map((item) => (
            <div key={item.id} className="grid grid-cols-[1.5fr_0.45fr_0.65fr_0.75fr] items-center gap-4 px-4 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[6px] bg-[var(--bg-surface)]">
                  {item.product?.images?.[0] ? (
                    <SmartImage src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[11px] text-text-muted">{t("no_image")}</div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-bold text-text-primary">{item.product?.name || t("products")}</p>
                  <p className="text-[12px] text-text-muted">
                    {item.size || t("free")} / {item.color || t("default_label")}
                  </p>
                </div>
              </div>
              <span className="text-center text-[14px] font-semibold text-text-primary">{item.quantity}</span>
              <span className="text-right text-[14px] text-text-primary">{formatPriceNpr(item.price)}</span>
              <span className="text-right text-[14px] font-bold text-text-primary">{formatPriceNpr(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-3 md:hidden">
        {order.items.map((item) => (
          <div key={item.id} className="rounded-[8px] border border-border-light bg-[var(--bg-surface)] p-3">
            <div className="flex gap-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[6px] bg-card">
                {item.product?.images?.[0] ? (
                  <SmartImage src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[11px] text-text-muted">{t("no_image")}</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold text-text-primary">{item.product?.name || t("products")}</p>
                <p className="mt-1 text-[12px] text-text-muted">
                  {t("qty")}: {item.quantity} • {item.size || t("free")} • {item.color || t("default_label")}
                </p>
                <div className="mt-3 flex items-center justify-between gap-3 text-[13px]">
                  <span className="text-text-muted">{formatPriceNpr(item.price)}</span>
                  <span className="font-bold text-text-primary">{formatPriceNpr(item.price * item.quantity)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div>
          <h3 className="border-b border-border-light pb-3 text-[18px] font-bold text-text-primary">Customer Notes</h3>
          <p className="mt-3 text-[14px] text-text-secondary">
            {deliveryAddress?.deliveryMethod ? `${deliveryAddress.deliveryMethod} delivery selected.` : "No customer notes."}
          </p>
          {deliveryAddress?.paymentReference ? (
            <p className="mt-2 text-[13px] text-text-muted">Payment reference: {deliveryAddress.paymentReference}</p>
          ) : null}
        </div>

        <div className="rounded-[8px] bg-[var(--bg-surface)] p-4">
          <div className="space-y-3 text-[14px]">
            <div className="flex items-center justify-between gap-4">
              <span className="text-text-secondary">Subtotal</span>
              <span className="font-semibold text-text-primary">{formatPriceNpr(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-text-secondary">Shipping</span>
              <span className="font-semibold text-text-primary">{formatPriceNpr(shipping)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-text-secondary">Discount</span>
              <span className="font-semibold text-success">- {formatPriceNpr(discount)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-text-secondary">Tax</span>
              <span className="font-semibold text-text-primary">{formatPriceNpr(tax)}</span>
            </div>
            <div className="border-t border-border-light pt-3">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[20px] font-bold text-text-primary">Total</span>
                <span className="text-[22px] font-bold text-text-primary">{formatPriceNpr(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

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
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }

          .account-invoice-print,
          .account-invoice-print * {
            visibility: visible !important;
          }

          .account-invoice-print {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            border: 0 !important;
            box-shadow: none !important;
          }

          .account-no-print {
            display: none !important;
          }
        }
      `}</style>
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
              const isSelected = selectedOrder === order.id;

              return (
                <div key={order.id} className="overflow-hidden rounded-[8px] bg-card shadow-[var(--shadow-sm)]">
                  <div className="border-b border-border-light p-4 sm:p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-3">
                          <h2 className="text-[18px] font-semibold text-text-primary">{order.orderNumber}</h2>
                          <span className={`rounded-[20px] px-3 py-1 text-[12px] font-semibold ${config.bgColor} ${config.color}`}>
                            {t(config.label)}
                          </span>
                        </div>
                        <p className="text-[13px] text-text-muted">
                          {new Date(order.createdAt).toLocaleDateString("en-NP")} • {order.items.length} {t("items_label")} • {order.paymentMethod}
                        </p>
                        <p className="mt-1 text-[13px] text-text-muted">{t("vendor")}: {order.vendor.shopName}</p>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-3 md:justify-end">
                        <p className="text-[20px] font-bold text-text-primary">{formatPriceNpr(order.totalAmount)}</p>
                        <button
                          onClick={() => setSelectedOrder(isSelected ? null : order.id)}
                          className="inline-flex h-10 items-center gap-2 rounded-full border border-fb-pink px-4 text-[13px] font-semibold text-fb-pink transition-colors hover:bg-fb-pink hover:text-white"
                        >
                          <FileText className="h-4 w-4" />
                          {isSelected ? t("hide_details") : "View Bill"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {isSelected ? (
                    <div className="space-y-4 bg-[var(--bg-surface)] p-4 sm:p-6">
                      <div className="account-no-print flex flex-col gap-3 rounded-[8px] border border-border-light bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="mb-1 flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${config.color}`} />
                            <span className="text-[14px] font-semibold text-text-primary">{t("current_status")}: {t(config.label)}</span>
                          </div>
                          <p className="text-[13px] text-text-muted">{t("vendor")}: {order.vendor.shopName}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-text-primary px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
                        >
                          <Printer className="h-4 w-4" />
                          Print Bill
                        </button>
                      </div>

                      <OrderInvoice order={order} />

                      {order.status === "DELIVERED" ? (
                        <div className="account-no-print rounded-[8px] border border-border-light bg-card p-4">
                          <p className="mb-3 text-[14px] font-semibold text-text-primary">{t("write_review")}</p>
                          <div className="flex flex-wrap gap-2">
                            {order.items.map((item) => {
                              if (!item.product) return null;

                              return (
                                <Link
                                  key={item.id}
                                  href={`/products/${item.product.slug || item.product.id}#reviews`}
                                  className="rounded-full border border-fb-pink px-3 py-1.5 text-[12px] font-semibold text-fb-pink"
                                >
                                  {item.product.name}
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}
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
