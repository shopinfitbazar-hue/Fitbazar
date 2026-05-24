"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/lib/LanguageContext";

const supportTopicKeys = [
  "support_topic_order_help",
  "support_topic_delivery",
  "support_topic_returns",
  "support_topic_vendor",
  "support_topic_account",
  "support_topic_other",
] as const;

export default function HelpPage() {
  const { t } = useLanguage();
  const supportTopics = useMemo(() => supportTopicKeys.map((key) => t(key)), [t]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    topic: supportTopics[0] || "",
    orderNumber: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [contactDetails, setContactDetails] = useState({
    supportEmail: "support@fitbazar.com",
    supportPhone: "+977 9800000000",
    supportHours: "Sun-Fri, 10am-6pm",
  });

  useEffect(() => {
    if (!form.topic && supportTopics[0]) {
      setForm((current) => ({ ...current, topic: supportTopics[0] }));
    }
  }, [form.topic, supportTopics]);

  useEffect(() => {
    async function loadSupportSettings() {
      try {
        const response = await fetch("/api/site-settings", { cache: "no-store" });
        const data = (await response.json()) as {
          supportEmail?: string;
          supportPhone?: string;
          supportHours?: string | null;
        };
        if (!response.ok) return;

        setContactDetails({
          supportEmail: data.supportEmail || "support@fitbazar.com",
          supportPhone: data.supportPhone || "+977 9800000000",
          supportHours: data.supportHours || "Sun-Fri, 10am-6pm",
        });
      } catch {
        return;
      }
    }

    void loadSupportSettings();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setError(data.error || t("support_submit_failed"));
        return;
      }

      setSuccess(data.message || t("support_submit_success"));
      setForm((current) => ({ ...current, orderNumber: "", message: "" }));
    } catch {
      setError(t("support_submit_failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="bg-page">
      <Header />
      <div className="container py-8">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[12px] bg-card p-6 shadow-[var(--shadow-sm)]">
            <h1>{t("help_support")}</h1>
            <p className="mt-2 text-[14px] text-text-secondary">{t("help_support_intro")}</p>

            <div className="mt-6 space-y-4 text-[14px] text-text-secondary">
              <div className="rounded-[8px] border border-border-light p-4">
                <div className="text-[12px] uppercase tracking-[1px] text-text-muted">{t("customer_policy")}</div>
                <p className="mt-2">{t("help_returns_text")}</p>
              </div>
              <div className="rounded-[8px] border border-border-light p-4">
                <div className="text-[12px] uppercase tracking-[1px] text-text-muted">{t("contact")}</div>
                <p className="mt-2">{contactDetails.supportEmail}</p>
                <p className="mt-1">{contactDetails.supportPhone}</p>
                <p className="mt-1 text-[12px] text-text-muted">{contactDetails.supportHours}</p>
              </div>
              <div className="rounded-[8px] border border-border-light p-4">
                <div className="text-[12px] uppercase tracking-[1px] text-text-muted">{t("delivery")}</div>
                <p className="mt-2">{t("help_delivery_text")}</p>
              </div>
            </div>
          </section>

          <section className="rounded-[12px] bg-card p-6 shadow-[var(--shadow-sm)]">
            <h2 className="text-[20px] font-semibold text-text-primary">{t("contact_support_team")}</h2>
            <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("full_name")}</label>
                  <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
                </div>
                <div>
                  <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("email")}</label>
                  <input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("topic")}</label>
                  <select value={form.topic} onChange={(event) => setForm((current) => ({ ...current, topic: event.target.value }))}>
                    {supportTopics.map((topic) => (
                      <option key={topic} value={topic}>
                        {topic}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("order_number_optional")}</label>
                  <input value={form.orderNumber} onChange={(event) => setForm((current) => ({ ...current, orderNumber: event.target.value }))} />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("message")}</label>
                <textarea rows={6} value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} required />
              </div>

              {error ? <p className="text-[12px] text-fb-pink">{error}</p> : null}
              {success ? <p className="text-[13px] text-success">{success}</p> : null}

              <button type="submit" disabled={submitting} className="btn-primary w-full md:w-fit">
                {submitting ? t("sending") : t("send_message")}
              </button>
            </form>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  );
}
