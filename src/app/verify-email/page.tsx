"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/lib/LanguageContext";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState(t("verifying_email"));

  useEffect(() => {
    const email = searchParams?.get("email") || "";
    const token = searchParams?.get("token") || "";

    if (!email || !token) {
      setStatus("error");
      setMessage(t("invalid_verification_link"));
      return;
    }

    async function verify() {
      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, token }),
        });
        const data = (await response.json()) as { error?: string };
        if (!response.ok) {
          setStatus("error");
          setMessage(data.error || t("verification_failed"));
          return;
        }

        setStatus("success");
        setMessage(t("verification_success"));
      } catch {
        setStatus("error");
        setMessage(t("verification_failed"));
      }
    }

    void verify();
  }, [searchParams, t]);

  return (
    <main className="bg-page">
      <Header />
      <div className="container py-10">
        <div className="mx-auto max-w-[520px] rounded-[12px] bg-card p-6 text-center shadow-[var(--shadow-md)] md:p-8">
          <h1>{t("verify_email")}</h1>
          <p className={`mt-4 text-[14px] ${status === "error" ? "text-fb-pink" : status === "success" ? "text-success" : "text-text-secondary"}`}>
            {message}
          </p>
          <Link href="/login" className="btn-primary mt-6 inline-flex">
            {t("go_to_login")}
          </Link>
        </div>
      </div>
      <Footer />
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
