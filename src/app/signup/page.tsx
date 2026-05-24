"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { normalizeAuthCallbackPath, resolvePostLoginPath } from "@/lib/auth-redirect";

function SignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const callbackUrl = normalizeAuthCallbackPath(searchParams?.get("callbackUrl") ?? null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });

  const passwordStrength = useMemo(() => {
    let strength = 0;
    if (formData.password.length >= 8) strength += 1;
    if (/[A-Z]/.test(formData.password)) strength += 1;
    if (/[0-9]/.test(formData.password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(formData.password)) strength += 1;
    return strength;
  }, [formData.password]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!formData.agreeTerms) {
      setError(t("agree_terms_continue"));
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setIsLoading(false);
        setError(data.error || t("unable_create_account"));
        return;
      }

      const signInResult = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
        callbackUrl,
      });

      setIsLoading(false);

      if (signInResult?.error) {
        setError(signInResult.error);
        return;
      }

      const sessionResponse = await fetch("/api/auth/session", { cache: "no-store" });
      const sessionData = await sessionResponse.json().catch(() => null);
      const nextPath = resolvePostLoginPath(callbackUrl, sessionData?.user?.role);

      router.push(nextPath);
      router.refresh();
    } catch {
      setIsLoading(false);
      setError(t("unable_create_account"));
    }
  };

  return (
    <main className="bg-page">
      <Header />
      <div className="container flex min-h-[calc(100vh-60px)] items-center justify-center py-10">
        <div className="w-full max-w-[440px] rounded-[8px] bg-card p-8 shadow-[var(--shadow-md)]">
          <div className="text-center">
            <h1>{t("create_account")}</h1>
            <p className="mt-2 text-[14px] text-text-muted">{t("create_account_subtext")}</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("full_name")}</label>
              <input value={formData.name} onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))} />
            </div>

            <div>
              <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("phone_number")}</label>
              <input value={formData.phone} onChange={(event) => setFormData((current) => ({ ...current, phone: event.target.value }))} />
            </div>

            <div>
              <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("email")}</label>
              <input type="email" value={formData.email} onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))} />
            </div>

            <div>
              <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("password")}</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))}
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {formData.password ? (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((index) => (
                      <div
                        key={index}
                        className={`h-1 flex-1 rounded-full ${passwordStrength > index ? ["bg-fb-pink", "bg-fb-orange", "bg-[#FFC94A]", "bg-success"][passwordStrength - 1] : "bg-border-light"}`}
                      />
                    ))}
                  </div>
                  <p className="mt-1 text-[12px] text-text-muted">
                    {[t("weak_password"), t("fair_password"), t("good_password"), t("strong_password")][Math.max(passwordStrength - 1, 0)]}
                  </p>
                </div>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("confirm_password")}</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(event) => setFormData((current) => ({ ...current, confirmPassword: event.target.value }))}
              />
            </div>

            <label className="flex items-start gap-3 text-[13px] text-text-secondary">
              <input
                type="checkbox"
                checked={formData.agreeTerms}
                onChange={(event) => setFormData((current) => ({ ...current, agreeTerms: event.target.checked }))}
                className="mt-1 h-4 w-4"
              />
              <span>{t("agree_terms")}</span>
            </label>

            {error ? <p className="text-[12px] text-fb-pink">{error}</p> : null}
            <p className="text-[12px] text-text-muted">{t("verification_optional_notice")}</p>

            <button type="submit" disabled={isLoading} className="btn-primary flex w-full items-center justify-center gap-2">
              {isLoading ? t("creating_account") : t("create_account")}
              {!isLoading ? <ArrowRight className="h-4 w-4 text-white" /> : null}
            </button>
          </form>

          <div className="mt-6 text-center text-[14px] text-text-secondary">
            {t("already_have_account")}{" "}
            <Link href={`/login${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`} className="font-semibold text-fb-pink">
              {t("sign_in")}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupPageContent />
    </Suspense>
  );
}
