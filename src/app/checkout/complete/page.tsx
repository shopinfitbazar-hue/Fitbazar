"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useToast } from "@/lib/ToastContext";
import { useLanguage } from "@/lib/LanguageContext";
import { useCart } from "@/lib/cart";

function CheckoutCompleteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const { addToast } = useToast();
  const { clearCart } = useCart();
  const hasStarted = useRef(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (hasStarted.current) {
      return;
    }

    hasStarted.current = true;

    const method = (searchParams?.get("method") || "").toUpperCase();
    const token = searchParams?.get("token") || "";
    const status = searchParams?.get("status") || "";

    if (!method || !token) {
      setErrorMessage(t("payment_return_invalid"));
      return;
    }

    async function confirmPayment() {
      try {
        const response = await fetch("/api/payments/confirm", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            method,
            token,
            status,
            sessionId: searchParams?.get("session_id") || undefined,
            pidx: searchParams?.get("pidx") || undefined,
            encodedData: searchParams?.get("data") || undefined,
          }),
        });
        const data = await response.json();

        if (!response.ok) {
          setErrorMessage(data.error || t("payment_confirmation_failed"));
          addToast(data.error || t("payment_confirmation_failed"), "error");
          return;
        }

        clearCart();
        addToast(t("payment_verified_success"), "success");
        router.replace(data.redirectUrl || "/account/orders");
      } catch {
        setErrorMessage(t("payment_confirmation_failed"));
        addToast(t("payment_confirmation_failed"), "error");
      }
    }

    void confirmPayment();
  }, [addToast, clearCart, router, searchParams, t]);

  return (
    <main className="bg-page">
      <Header />
      <div className="container py-10">
        <div className="mx-auto max-w-[620px] rounded-[8px] bg-card p-8 text-center shadow-[var(--shadow-sm)]">
          {errorMessage ? (
            <>
              <h1>{t("payment_failed_title")}</h1>
              <p className="mt-3 text-[14px] text-text-secondary">{errorMessage}</p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link href="/checkout" className="btn-primary inline-flex items-center justify-center">
                  {t("return_to_checkout")}
                </Link>
                <Link href="/help" className="btn-ghost inline-flex items-center justify-center">
                  {t("get_help")}
                </Link>
              </div>
            </>
          ) : (
            <>
              <h1>{t("verifying_payment")}</h1>
              <p className="mt-3 text-[14px] text-text-secondary">{t("secure_payment_check")}</p>
            </>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}

export default function CheckoutCompletePage() {
  return (
    <Suspense>
      <CheckoutCompleteContent />
    </Suspense>
  );
}
