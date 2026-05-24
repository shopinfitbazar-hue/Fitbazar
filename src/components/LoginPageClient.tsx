"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { normalizeAuthCallbackPath, resolvePostLoginPath } from "@/lib/auth-redirect";

function LoginPageContent({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, update } = useSession();
  const { t } = useLanguage();
  const callbackUrl = normalizeAuthCallbackPath(searchParams?.get("callbackUrl") ?? null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    if (session?.user) {
      const path = resolvePostLoginPath(callbackUrl, session.user.role);
      router.replace(path);
    }
  }, [session, callbackUrl, router]);

  useEffect(() => {
    const errorParam = searchParams?.get("error");
    if (!errorParam) return;

    const message =
      errorParam === "CredentialsSignin"
        ? t("incorrect_password")
        : errorParam === "AccessDenied"
          ? t("unable_signin")
          : t("unable_signin");

    setError(message);
  }, [searchParams, t]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!formData.email.trim() || !formData.password.trim()) {
      setError(t("enter_email_password"));
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (!result) {
        setError(t("unable_signin"));
        setIsLoading(false);
        return;
      }

      if (result.error) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      const updatedSession = await update();
      const path = resolvePostLoginPath(callbackUrl, updatedSession?.user?.role);
      router.replace(path);
    } catch {
      setIsLoading(false);
      setError(t("unable_signin"));
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    if (!googleEnabled) {
      setError(t("use_email_for_now"));
      return;
    }

    try {
      await signIn("google", { callbackUrl });
    } catch {
      setError(t("unable_signin"));
    }
  };

  return (
    <main className="bg-page">
      <Header />
      <div className="container flex min-h-[calc(100vh-60px)] items-center justify-center py-10">
        <div className="w-full max-w-[420px] rounded-[8px] bg-card p-8 shadow-[var(--shadow-md)]">
          <div className="text-center">
            <h1>{t("login")}</h1>
            <p className="mt-2 text-[14px] text-text-muted">{t("access_account_manage_orders")}</p>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-[4px] border border-border-default px-4 py-3 text-[14px] font-semibold text-text-primary disabled:opacity-60"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {t("continue_with_google")}
          </button>
          {!googleEnabled ? (
            <p className="mt-2 text-center text-[12px] text-text-muted">
              {t("google_signin_disabled")}
            </p>
          ) : null}

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border-light" />
            <span className="text-[12px] uppercase tracking-[1px] text-text-muted">{t("or")}</span>
            <div className="h-px flex-1 bg-border-light" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("email")}</label>
              <input
                type="email"
                value={formData.email}
                onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
                placeholder={t("email_example")}
              />
            </div>

            <div>
              <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("password")}</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))}
                  placeholder={t("enter_password")}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="mt-2 text-right">
                <Link href="/forgot-password" className="text-[12px] font-semibold text-fb-pink">
                  {t("forgot_password")}
                </Link>
              </div>
            </div>

            {error ? <p className="text-[12px] text-fb-pink">{error}</p> : null}

            <button type="submit" disabled={isLoading} className="btn-primary flex w-full items-center justify-center gap-2">
              {isLoading ? t("signing_in") : t("sign_in")}
              {!isLoading ? <ArrowRight className="h-4 w-4 text-white" /> : null}
            </button>
          </form>

          <div className="mt-6 text-center text-[14px] text-text-secondary">
            {t("dont_have_account")}{" "}
            <Link href={`/signup${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`} className="font-semibold text-fb-pink">
              {t("signup")}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function LoginPageClient({ googleEnabled }: { googleEnabled: boolean }) {
  return (
    <Suspense>
      <LoginPageContent googleEnabled={googleEnabled} />
    </Suspense>
  );
}
