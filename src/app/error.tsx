"use client";

import { useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/lib/LanguageContext";
import { captureException } from "@/lib/monitoring";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLanguage();

  useEffect(() => {
    captureException(error, { area: "app-error-boundary" });
  }, [error]);

  return (
    <main className="bg-page">
      <Header />
      <div className="container py-12">
        <div className="mx-auto max-w-[560px] rounded-[28px] border border-white/70 bg-card p-10 text-center shadow-[var(--shadow-card-lg)]">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-fb-pink-bg text-[28px] font-bold text-fb-pink">
            !
          </div>
          <h1 className="mt-5">{t("something_went_wrong")}</h1>
          <p className="mt-3 text-[14px] text-text-muted">
            {t("page_error_message")}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button type="button" onClick={() => reset()} className="btn-primary">
              {t("try_again")}
            </button>
            <Link href="/" className="btn-ghost">
              Go Home
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
