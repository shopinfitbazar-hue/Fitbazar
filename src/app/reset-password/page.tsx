"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/lib/LanguageContext";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const email = searchParams?.get("email") || "";
  const token = searchParams?.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          token,
          password,
          confirmPassword,
        }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error || "Unable to reset password.");
        return;
      }

      setSuccess(t("password_reset_success"));
      window.setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch {
      setError("Unable to reset password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="bg-page">
      <Header />
      <div className="container py-10">
        <div className="mx-auto max-w-[520px] rounded-[12px] bg-card p-6 shadow-[var(--shadow-md)] md:p-8">
          <h1>{t("reset_password")}</h1>
          <p className="mt-2 text-[14px] text-text-secondary">{t("reset_password_help")}</p>

          {!email || !token ? (
            <div className="mt-6 rounded-[8px] border border-border-light bg-[var(--bg-surface)] p-4 text-[13px] text-text-secondary">
              <p>{t("invalid_reset_link")}</p>
              <Link href="/forgot-password" className="mt-3 inline-block font-semibold text-fb-pink">
                {t("request_new_link")}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("new_password")}</label>
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
              </div>
              <div>
                <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("confirm_password")}</label>
                <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
              </div>

              {error ? <p className="text-[12px] text-fb-pink">{error}</p> : null}
              {success ? <p className="text-[13px] text-success">{success}</p> : null}

              <button type="submit" disabled={submitting} className="btn-primary w-full">
                {submitting ? t("saving") : t("reset_password")}
              </button>
            </form>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}
