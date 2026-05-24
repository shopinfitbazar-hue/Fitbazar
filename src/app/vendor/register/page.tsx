"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/lib/LanguageContext";

const initialState = {
  shopName: "",
  shopDescription: "",
  ownerName: "",
  email: "",
  phone: "",
  panNumber: "",
  address: "",
  zone: "Kathmandu",
  district: "",
  bankName: "",
  accountNumber: "",
  accountHolder: "",
  password: "",
  confirmPassword: "",
  agreeTerms: false,
};

export default function VendorRegisterPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [formData, setFormData] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (field: keyof typeof initialState, value: string | boolean) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!formData.agreeTerms) {
      setError("Please accept the vendor terms before continuing.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/vendor/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error || "Unable to submit your vendor application.");
        return;
      }

      const signInResult = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
        callbackUrl: "/vendor/dashboard?pending=1",
      });

      if (signInResult?.error) {
        setError(signInResult.error);
        return;
      }

      router.push("/vendor/dashboard?pending=1");
      router.refresh();
    } catch {
      setError("Unable to submit your vendor application.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="bg-page">
      <Header />
      <div className="container py-10">
        <div className="mx-auto max-w-[880px] rounded-[12px] bg-card p-6 shadow-[var(--shadow-md)] md:p-8">
          <div className="mb-8">
            <h1>Become a Vendor</h1>
            <p className="mt-2 text-[14px] text-text-muted">
              Create your own Fit Bazar vendor account. Your store will be available after admin approval.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              <h2 className="text-[16px] font-semibold text-text-primary">Store Details</h2>

              <div>
                <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">Shop Name</label>
                <input value={formData.shopName} onChange={(event) => handleChange("shopName", event.target.value)} required />
              </div>

              <div>
                <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">Shop Description</label>
                <textarea rows={4} value={formData.shopDescription} onChange={(event) => handleChange("shopDescription", event.target.value)} />
              </div>

              <div>
                <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">PAN Number</label>
                <input value={formData.panNumber} onChange={(event) => handleChange("panNumber", event.target.value)} required />
              </div>

              <div>
                <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">Business Address</label>
                <input value={formData.address} onChange={(event) => handleChange("address", event.target.value)} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">Zone</label>
                  <select value={formData.zone} onChange={(event) => handleChange("zone", event.target.value)}>
                    {["Kathmandu", "Lalitpur", "Bhaktapur", "Other Nepal"].map((zone) => (
                      <option key={zone} value={zone}>
                        {zone}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">District</label>
                  <input value={formData.district} onChange={(event) => handleChange("district", event.target.value)} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">Bank Name</label>
                  <input value={formData.bankName} onChange={(event) => handleChange("bankName", event.target.value)} />
                </div>
                <div>
                  <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">Account Number</label>
                  <input value={formData.accountNumber} onChange={(event) => handleChange("accountNumber", event.target.value)} />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">Account Holder</label>
                <input value={formData.accountHolder} onChange={(event) => handleChange("accountHolder", event.target.value)} />
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-[16px] font-semibold text-text-primary">Owner Login</h2>

              <div>
                <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">Owner Name</label>
                <input value={formData.ownerName} onChange={(event) => handleChange("ownerName", event.target.value)} required />
              </div>

              <div>
                <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("email")}</label>
                <input type="email" value={formData.email} onChange={(event) => handleChange("email", event.target.value)} required />
              </div>

              <div>
                <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("phone_number")}</label>
                <input value={formData.phone} onChange={(event) => handleChange("phone", event.target.value)} required />
              </div>

              <div>
                <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("password")}</label>
                <input type="password" value={formData.password} onChange={(event) => handleChange("password", event.target.value)} required />
              </div>

              <div>
                <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("confirm_password")}</label>
                <input type="password" value={formData.confirmPassword} onChange={(event) => handleChange("confirmPassword", event.target.value)} required />
              </div>

              <label className="flex items-start gap-3 text-[13px] text-text-secondary">
                <input
                  type="checkbox"
                  checked={formData.agreeTerms}
                  onChange={(event) => handleChange("agreeTerms", event.target.checked)}
                  className="mt-1 h-4 w-4"
                />
                <span>{t("vendor_terms_agreement")}</span>
              </label>

              {error ? <p className="text-[12px] text-fb-pink">{error}</p> : null}

              <div className="rounded-[8px] border border-border-light bg-[var(--bg-surface)] p-4 text-[13px] text-text-secondary">
                {t("vendor_account_pending_note")}
              </div>

              <button type="submit" disabled={submitting} className="btn-primary w-full">
                {submitting ? t("submitting") : t("create_vendor_account")}
              </button>

              <p className="text-[14px] text-text-secondary">
                {t("already_have_vendor_login")}{" "}
                <Link href="/login?callbackUrl=/vendor/dashboard" className="font-semibold text-fb-pink">
                  {t("sign_in_here")}
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </main>
  );
}
