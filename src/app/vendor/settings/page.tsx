"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import VendorSidebar from "@/components/VendorSidebar";
import { useLanguage } from "@/lib/LanguageContext";
import CloudinaryImageUploader from "@/components/CloudinaryImageUploader";

type VendorSettingsResponse = {
  vendor: {
    shopName: string;
    slug: string;
    logo?: string | null;
    banner?: string | null;
    description?: string | null;
    category?: string | null;
    phone?: string | null;
    panNumber?: string | null;
    bankAccount?: string | null;
    isApproved: boolean;
    isSuspended: boolean;
  };
  owner: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  };
};

const emptyForm = {
  ownerName: "",
  ownerPhone: "",
  shopName: "",
  description: "",
  category: "",
  logo: "",
  banner: "",
  phone: "",
  panNumber: "",
  bankAccount: "",
};

export default function VendorSettingsPage() {
  const { t } = useLanguage();
  const [data, setData] = useState<VendorSettingsResponse | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSettings() {
      const response = await fetch("/api/vendor/settings", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || t("vendor_access_unavailable"));
        return;
      }

      setData(result);
      setForm({
        ownerName: result.owner?.name || "",
        ownerPhone: result.owner?.phone || "",
        shopName: result.vendor?.shopName || "",
        description: result.vendor?.description || "",
        category: result.vendor?.category || "",
        logo: result.vendor?.logo || "",
        banner: result.vendor?.banner || "",
        phone: result.vendor?.phone || "",
        panNumber: result.vendor?.panNumber || "",
        bankAccount: result.vendor?.bankAccount || "",
      });
    }

    void loadSettings();
  }, [t]);

  const saveSettings = async () => {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/vendor/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || t("unable_save_vendor_settings"));
        return;
      }

      setData(result);
      setMessage(t("vendor_settings_saved"));
    } catch {
      setError(t("unable_save_vendor_settings"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="bg-page">
      <Header />
      <div className="mx-auto flex max-w-site">
        <VendorSidebar
          shopName={data?.vendor.shopName}
          isApproved={data?.vendor.isApproved}
          isSuspended={data?.vendor.isSuspended}
          subtitle={t("settings")}
        />
        <section className="flex-1 p-4 md:p-6">
          <div className="rounded-[8px] bg-card p-5">
            <h1>{t("settings")}</h1>
            <p className="mt-2 text-[14px] text-text-secondary">{t("vendor_settings_intro")}</p>
            {error ? <p className="mt-3 text-[12px] text-fb-pink">{error}</p> : null}
            {message ? <p className="mt-3 text-[13px] text-success">{message}</p> : null}
          </div>

          <div className="mt-4 rounded-[8px] bg-card p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("full_name")}</label>
                <input value={form.ownerName} onChange={(event) => setForm((current) => ({ ...current, ownerName: event.target.value }))} />
              </div>
              <div>
                <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("phone_number")}</label>
                <input value={form.ownerPhone} onChange={(event) => setForm((current) => ({ ...current, ownerPhone: event.target.value }))} />
              </div>
              <div>
                <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("shop_name")}</label>
                <input value={form.shopName} onChange={(event) => setForm((current) => ({ ...current, shopName: event.target.value }))} />
              </div>
              <div>
                <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("category")}</label>
                <input value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("description")}</label>
                <textarea rows={4} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
              </div>
              <div>
                <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("logo_url")}</label>
                <input value={form.logo} onChange={(event) => setForm((current) => ({ ...current, logo: event.target.value }))} />
                <div className="mt-3">
	                  <CloudinaryImageUploader
	                    buttonLabel={t("upload_logo")}
	                    multiple={false}
	                    enableCamera
	                    onUploaded={(urls) => setForm((current) => ({ ...current, logo: urls[0] || current.logo }))}
	                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("banner_url")}</label>
                <input value={form.banner} onChange={(event) => setForm((current) => ({ ...current, banner: event.target.value }))} />
                <div className="mt-3">
	                  <CloudinaryImageUploader
	                    buttonLabel={t("upload_store_banner")}
	                    multiple={false}
	                    enableCamera
	                    onUploaded={(urls) => setForm((current) => ({ ...current, banner: urls[0] || current.banner }))}
	                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("shop_phone")}</label>
                <input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
              </div>
              <div>
                <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("pan_number")}</label>
                <input value={form.panNumber} onChange={(event) => setForm((current) => ({ ...current, panNumber: event.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("bank_account")}</label>
                <input value={form.bankAccount} onChange={(event) => setForm((current) => ({ ...current, bankAccount: event.target.value }))} />
              </div>
            </div>

            <div className="mt-5">
              <button type="button" onClick={saveSettings} className="btn-primary" disabled={saving}>
                {saving ? t("saving") : t("save_settings")}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
