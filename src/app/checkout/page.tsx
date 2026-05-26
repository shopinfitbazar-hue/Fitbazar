"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { CheckCircle2, MapPin, ShieldCheck, Truck, Wallet } from "lucide-react";
import SmartImage from "@/components/ui/SmartImage";
import { useCart } from "@/lib/cart";
import { formatPriceNpr } from "@/lib/catalog";
import { useToast } from "@/lib/ToastContext";
import { useLanguage } from "@/lib/LanguageContext";
import type { SupportedPaymentMethod } from "@/lib/payment-types";
import { getDeliveryMessage } from "@/lib/pincode";

const zones = ["Kathmandu"];

function CheckoutPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const { data: session, status } = useSession();
  const { items, total, clearCart } = useCart();
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    zone: "Kathmandu",
    district: "Kathmandu",
    pincode: "",
    address: "",
    landmark: "",
  });
  const [selectedDelivery, setSelectedDelivery] = useState("standard");
  const [selectedPayment, setSelectedPayment] = useState<SupportedPaymentMethod>("KHALTI");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const initialCoupon = searchParams?.get("coupon") || "";
  const [appliedCoupon, setAppliedCoupon] = useState(initialCoupon);
  const [isProcessing, setIsProcessing] = useState(false);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(2000);
  const [availablePayments, setAvailablePayments] = useState<Record<SupportedPaymentMethod, boolean>>({
    COD: true,
    ESEWA: true,
    KHALTI: true,
    CONNECTIPS: true,
    FONEPAY: true,
    LOCAL_CARD: true,
  });

  const deliveryOptions = useMemo(
    () => [
      { id: "standard", name: t("standard_delivery"), time: t("delivery_days_standard"), price: 100 },
      { id: "express", name: t("express_delivery"), time: t("delivery_days_express"), price: 250 },
      { id: "pickup", name: t("store_pickup"), time: t("same_day"), price: 0 },
    ],
    [t],
  );

  const paymentMethods = useMemo(
    () => [
      { id: "ESEWA", name: "eSewa", description: t("pay_via_esewa") },
      { id: "KHALTI", name: "Khalti", description: t("digital_wallet") },
      { id: "CONNECTIPS", name: "connectIPS", description: t("pay_from_bank_account") },
      { id: "FONEPAY", name: "Fonepay", description: t("pay_via_fonepay") },
      { id: "LOCAL_CARD", name: t("local_cards"), description: t("local_cards_via_khalti") },
      { id: "COD", name: "Cash on Delivery", description: t("pay_on_receive") },
    ],
    [t],
  );

  useEffect(() => {
    if (session?.user) {
      setFormData((current) => ({
        ...current,
        name: current.name || session.user.name || "",
        email: current.email || session.user.email || "",
      }));
    }
  }, [session]);

  useEffect(() => {
    async function hydrateCheckoutConfig() {
      try {
        const [settingsResponse, paymentsResponse] = await Promise.all([
          fetch("/api/site-settings", { cache: "no-store" }),
          fetch("/api/payments/config", { cache: "no-store" }),
        ]);

        if (settingsResponse.ok) {
          const settings = await settingsResponse.json();
          if (typeof settings.minFreeDelivery === "number") {
            setFreeDeliveryThreshold(settings.minFreeDelivery);
          }
        }

        if (paymentsResponse.ok) {
          const paymentConfig = await paymentsResponse.json();
          if (paymentConfig.methods) {
            setAvailablePayments(paymentConfig.methods);
            setSelectedPayment((current) => {
              if (paymentConfig.methods[current]) {
                return current;
              }

              return (Object.entries(paymentConfig.methods).find(([, enabled]) => enabled)?.[0] || "COD") as SupportedPaymentMethod;
            });
          }
        }
      } catch {
        return;
      }
    }

    void hydrateCheckoutConfig();
  }, []);

  useEffect(() => {
    const code = searchParams?.get("coupon");
    if (!code || !total) return;

    async function validateCoupon() {
      try {
      const response = await fetch(`/api/cart/validate-coupon?code=${encodeURIComponent(code || "")}&subtotal=${total}`, {
          cache: "no-store",
        });
        const data = await response.json();
        if (response.ok) {
          setCouponDiscount(data.coupon.discountAmount);
          setAppliedCoupon(data.coupon.code);
        }
      } catch {
        setCouponDiscount(0);
      }
    }

    void validateCoupon();
  }, [searchParams, total]);

  useEffect(() => {
    if (searchParams?.get("paymentCanceled") === "1") {
      addToast(t("payment_cancelled"), "info");
    }
  }, [addToast, searchParams, t]);

  const selectedDeliveryOption = useMemo(
    () => deliveryOptions.find((delivery) => delivery.id === selectedDelivery) || deliveryOptions[0],
    [deliveryOptions, selectedDelivery],
  );
  const shipping = total >= freeDeliveryThreshold ? 0 : selectedDeliveryOption.price;
  const grandTotal = total - couponDiscount + shipping;

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!session?.user?.id) {
      router.push(`/login?callbackUrl=${encodeURIComponent("/checkout")}`);
      return;
    }

    if (!items.length) {
      addToast(t("your_bag_empty"), "error");
      return;
    }

    if (!formData.name || !formData.phone || !formData.address || !formData.zone || !formData.district || !formData.pincode) {
      addToast(t("complete_delivery_details"), "error");
      return;
    }

    const deliveryCheck = getDeliveryMessage(formData.pincode);
    if (!deliveryCheck.ok || formData.zone !== "Kathmandu" || formData.district.trim().toLowerCase() !== "kathmandu") {
      addToast(t("kathmandu_delivery_only"), "error");
      return;
    }

    if (!availablePayments[selectedPayment]) {
      addToast(t("selected_payment_unavailable"), "error");
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
          })),
          address: {
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            line1: `${formData.address}${formData.landmark ? `, ${formData.landmark}` : ""}`,
            zone: formData.zone,
            district: formData.district,
            pincode: formData.pincode,
          },
          paymentMethod: selectedPayment,
          deliveryMethod: selectedDelivery,
          couponCode: appliedCoupon || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        addToast(data.error || t("checkout_failed"), "error");
        return;
      }

      if (data.mode === "completed" && data.redirectUrl) {
        clearCart();
        addToast(t("order_placed_successfully"), "success");
        router.push(data.redirectUrl);
        return;
      }

      if (data.mode === "redirect" && data.redirectUrl) {
        addToast(t("redirecting_to_secure_payment"), "info");
        window.location.assign(data.redirectUrl);
        return;
      }

      if (data.mode === "form_post" && data.formAction && data.formFields) {
        addToast(t("redirecting_to_secure_payment"), "info");
        const form = document.createElement("form");
        form.method = "POST";
        form.action = data.formAction;
        form.style.display = "none";

        Object.entries(data.formFields).forEach(([key, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = String(value);
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
        return;
      }

      addToast(t("payment_initialization_failed"), "error");
    } catch {
      addToast(t("checkout_failed"), "error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (status === "loading") {
    return (
      <main className="bg-page">
        <Header />
        <div className="container py-8">
          <div className="rounded-[8px] bg-card p-8 text-center">
            <p className="text-[14px] text-text-muted">{t("loading_checkout")}</p>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (!session?.user) {
    return (
      <main className="bg-page">
        <Header />
        <div className="container py-8">
          <div className="rounded-[8px] bg-card p-8 text-center">
            <h1>{t("login_to_continue")}</h1>
            <p className="mt-2 text-[14px] text-text-muted">{t("login_required_checkout")}</p>
            <Link href={`/login?callbackUrl=${encodeURIComponent("/checkout")}`} className="btn-primary mt-5 inline-flex">
              {t("go_to_login")}
            </Link>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="bg-page">
        <Header />
        <div className="container py-8">
          <div className="rounded-[8px] bg-card p-8 text-center">
            <h1>{t("your_bag_empty")}</h1>
            <p className="mt-2 text-[14px] text-text-muted">{t("add_products_before_checkout")}</p>
            <Link href="/products" className="btn-primary mt-5 inline-flex">
              {t("browse_products")}
            </Link>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="bg-page">
      <Header />
      <div className="container py-8">
        <div className="mb-6 flex items-center gap-2 text-sm text-text-muted">
          <Link href="/" className="hover:text-fb-pink">{t("home")}</Link>
          <span>/</span>
          <Link href="/cart" className="hover:text-fb-pink">{t("cart")}</Link>
          <span>/</span>
          <span className="font-medium text-text-primary">{t("checkout")}</span>
        </div>

        <div className="mb-8 rounded-[8px] border border-border-light bg-card p-5 shadow-[var(--shadow-sm)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-text-muted">Secure checkout</div>
              <h1 className="mt-2 text-[32px] font-semibold tracking-[-0.04em]">{t("checkout")}</h1>
              <p className="mt-2 text-[14px] text-text-muted">Delivery, payment, and review in one clean flow.</p>
            </div>
            <div className="grid gap-2 text-[12px] text-text-secondary sm:grid-cols-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-[var(--bg-surface)] px-3 py-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                Address
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-[var(--bg-surface)] px-3 py-2">
                <Truck className="h-4 w-4 text-fb-orange" />
                Delivery
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-[var(--bg-surface)] px-3 py-2">
                <ShieldCheck className="h-4 w-4 text-fb-pink" />
                Payment
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <div className="rounded-[8px] border border-border-light bg-card p-6 shadow-[var(--shadow-sm)]">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <h2 className="flex items-center gap-3 text-[20px] font-semibold">
                    <MapPin className="h-5 w-5 text-fb-pink" />
                    {t("delivery_address")}
                  </h2>
                  <span className="rounded-full bg-[var(--green-bg)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-success">Kathmandu</span>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[1px] text-text-muted">{t("full_name")}</label>
                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} required placeholder={t("enter_full_name")} />
                  </div>

                  <div>
                    <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[1px] text-text-muted">{t("phone_number")}</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required placeholder={t("phone_example")} />
                  </div>

                  <div>
                    <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[1px] text-text-muted">{t("email")}</label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder={t("email_example")} />
                  </div>

                  <div>
                    <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[1px] text-text-muted">{t("zone")}</label>
                    <select name="zone" value={formData.zone} onChange={handleInputChange}>
                      {zones.map((zone) => (
                        <option key={zone} value={zone}>{zone}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[1px] text-text-muted">{t("district")}</label>
                    <input type="text" name="district" value={formData.district} onChange={handleInputChange} required placeholder={t("district_example")} />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[1px] text-text-muted">{t("delivery_pincode")}</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      required
                      maxLength={5}
                      placeholder="44600"
                    />
                    <p className="mt-2 text-[12px] text-text-muted">{t("kathmandu_delivery_only")}</p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[1px] text-text-muted">{t("street_address")}</label>
                    <input type="text" name="address" value={formData.address} onChange={handleInputChange} required placeholder={t("address_example")} />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[1px] text-text-muted">{t("landmark")}</label>
                    <input type="text" name="landmark" value={formData.landmark} onChange={handleInputChange} placeholder={t("landmark_example")} />
                  </div>
                </div>
              </div>

              <div className="rounded-[8px] border border-border-light bg-card p-6 shadow-[var(--shadow-sm)]">
                <h2 className="mb-6 flex items-center gap-3 text-[20px] font-semibold">
                  <Truck className="h-5 w-5 text-fb-pink" />
                  {t("delivery_method")}
                </h2>

                <div className="space-y-3">
                  {deliveryOptions.map((option) => (
                    <label
                      key={option.id}
                      className={`flex items-center justify-between rounded-[8px] border p-4 transition-shadow ${selectedDelivery === option.id ? "border-fb-pink bg-fb-pink-bg shadow-[var(--shadow-sm)]" : "border-border-light hover:shadow-[var(--shadow-sm)]"}`}
                    >
                      <div className="flex items-center gap-3">
                        <input type="radio" name="delivery" value={option.id} checked={selectedDelivery === option.id} onChange={(event) => setSelectedDelivery(event.target.value)} />
                        <div>
                          <p className="font-semibold text-text-primary">{option.name}</p>
                          <p className="text-[13px] text-text-muted">{option.time}</p>
                        </div>
                      </div>
                      <span className="font-semibold text-text-primary">{option.price === 0 ? t("free") : formatPriceNpr(option.price)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="rounded-[8px] border border-border-light bg-card p-6 shadow-[var(--shadow-sm)]">
                <h2 className="mb-6 flex items-center gap-3 text-[20px] font-semibold">
                  <Wallet className="h-5 w-5 text-fb-pink" />
                  {t("payment_method")}
                </h2>

                <div className="grid gap-3 md:grid-cols-2">
                  {paymentMethods.filter((method) => availablePayments[method.id as SupportedPaymentMethod]).map((method) => (
                    <label
                      key={method.id}
                      className={`rounded-[8px] border p-4 transition-shadow ${selectedPayment === method.id ? "border-fb-pink bg-fb-pink-bg shadow-[var(--shadow-sm)]" : "border-border-light hover:shadow-[var(--shadow-sm)]"}`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="payment"
                          value={method.id}
                          checked={selectedPayment === method.id}
                          onChange={(event) => setSelectedPayment(event.target.value as SupportedPaymentMethod)}
                        />
                        <div>
                          <p className="font-semibold text-text-primary">{method.name}</p>
                          <p className="text-[13px] text-text-muted">{method.description}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="sticky top-24 rounded-[8px] border border-border-light bg-card p-6 shadow-[var(--shadow-md)]">
                <h3 className="mb-6 text-[20px] font-semibold text-text-primary">{t("order_summary")}</h3>

                <div className="mb-6 space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="relative h-16 w-16 overflow-hidden rounded-[4px] bg-[var(--bg-surface)]">
                        <SmartImage src={item.image} alt={item.name} fill className="object-cover" />
                      </div>
                      <div className="flex-1">
                        <p className="line-clamp-1 text-[14px] font-medium text-text-primary">{item.name}</p>
                        <p className="text-[12px] text-text-muted">{t("qty")}: {item.quantity} • {item.size || t("free")}</p>
                      </div>
                      <p className="text-[14px] font-bold text-text-primary">{formatPriceNpr(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>

                <div className="mb-6 space-y-3 border-t border-border-light pt-4">
                  <div className="flex justify-between text-[14px]">
                    <span className="text-text-muted">{t("subtotal")}</span>
                    <span>{formatPriceNpr(total)}</span>
                  </div>
                  <div className="flex justify-between text-[14px]">
                    <span className="text-text-muted">{t("coupon_discount")}</span>
                    <span className="text-success">- {formatPriceNpr(couponDiscount)}</span>
                  </div>
                  <div className="flex justify-between text-[14px]">
                    <span className="text-text-muted">{t("shipping")} ({selectedDeliveryOption.name})</span>
                    <span>{shipping === 0 ? t("free") : formatPriceNpr(shipping)}</span>
                  </div>
                </div>

                <div className="mb-6 flex justify-between border-t border-border-light pt-4 text-[16px] font-bold text-text-primary">
                  <span>{t("total")}</span>
                  <span>{formatPriceNpr(grandTotal)}</span>
                </div>

                <button type="submit" disabled={isProcessing} className="btn-primary flex h-12 w-full items-center justify-center text-[16px] disabled:opacity-70">
                  {isProcessing ? t("placing_order") : t("place_order")}
                </button>
                {appliedCoupon ? <p className="mt-3 text-[12px] text-success">{appliedCoupon} {t("applicable_vendor_orders")}</p> : null}
              </div>
            </div>
          </div>
        </form>
      </div>

      <Footer />
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutPageInner />
    </Suspense>
  );
}
