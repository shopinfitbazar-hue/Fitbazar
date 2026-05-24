"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/lib/LanguageContext";

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [fallbackResetUrl, setFallbackResetUrl] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");
    setFallbackResetUrl("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = (await response.json()) as {
        error?: string;
        message?: string;
        resetUrl?: string;
      };

      if (!response.ok) {
        setError(data.error || "Unable to send reset link.");
        return;
      }

      setMessage(data.message || "Password reset instructions are ready.");
      setFallbackResetUrl(data.resetUrl || "");
    } catch {
      setError("Unable to send reset link.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="bg-page">
      <Header />
      <div className="container py-10">
        <div className="mx-auto max-w-[520px] rounded-[12px] bg-card p-6 shadow-[var(--shadow-md)] md:p-8">
          <h1>{t("forgot_password")}</h1>
          <p className="mt-2 text-[14px] text-text-secondary">
            {t("forgot_password_help")}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("email")}</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder={t("email_example")}
              />
            </div>

            {error ? <p className="text-[12px] text-fb-pink">{error}</p> : null}
            {message ? <p className="text-[13px] text-success">{message}</p> : null}
            {fallbackResetUrl ? (
              <div className="rounded-[8px] border border-border-light bg-[var(--bg-surface)] p-4 text-[13px] text-text-secondary">
                <p className="font-semibold text-text-primary">{t("manual_reset_link")}</p>
                <p className="mt-2 break-all">{fallbackResetUrl}</p>
              </div>
            ) : null}

            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? t("sending") : t("send_reset_link")}
            </button>
          </form>

          <p className="mt-5 text-[14px] text-text-secondary">
            <Link href="/login" className="font-semibold text-fb-pink">
              {t("back_to_login")}
            </Link>
          </p>
        </div>
      </div>
      <Footer />
    </main>
  );
}
