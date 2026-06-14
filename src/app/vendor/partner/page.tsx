"use client";

import { useEffect, useState } from "react";
import { BadgePercent, CalendarDays, CheckCircle2, Clock3, Crown, Sparkles } from "lucide-react";
import Header from "@/components/Header";
import VendorSidebar from "@/components/VendorSidebar";
import { formatPriceNpr } from "@/lib/catalog";
import { useLanguage } from "@/lib/LanguageContext";

type PartnerVendor = {
  shopName: string;
  isApproved: boolean;
  isSuspended: boolean;
  isPartnered: boolean;
  partnerStatus?: string | null;
  partnerPlan?: string | null;
  partnerRequestedAt?: string | null;
  partnerStartedAt?: string | null;
  partnerExpiresAt?: string | null;
  partnerRenewedAt?: string | null;
  partnerPaymentDue?: number | null;
  partnerPaymentNote?: string | null;
};

const plans = [
  {
    id: "MONTHLY",
    name: "Monthly Partner",
    price: 4000,
    monthly: "NPR 4,000/month",
    description: "Good for testing partner visibility month by month.",
  },
  {
    id: "ANNUAL",
    name: "Annual Partner",
    price: 24000,
    monthly: "NPR 2,000/month",
    description: "Best value: pay one year at once and save 50% monthly.",
  },
];

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-NP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function VendorPartnerPage() {
  const { t } = useLanguage();
  const [vendor, setVendor] = useState<PartnerVendor | null>(null);
  const [selectedPlan, setSelectedPlan] = useState("MONTHLY");
  const [paymentNote, setPaymentNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadPartnerStatus() {
    setLoading(true);
    const response = await fetch("/api/vendor/partner", { cache: "no-store" });
    const result = await response.json();
    if (response.ok) {
      setVendor(result.vendor);
      setSelectedPlan(result.vendor?.partnerPlan || "MONTHLY");
      setError("");
    } else {
      setError(result.error || t("vendor_access_unavailable"));
    }
    setLoading(false);
  }

  useEffect(() => {
    void loadPartnerStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitPartnerRequest = async () => {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/vendor/partner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan, paymentNote }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || "Unable to submit partner request.");
        return;
      }

      setVendor(result.vendor);
      setMessage("Partner request sent to admin for payment confirmation.");
      setPaymentNote("");
    } finally {
      setSaving(false);
    }
  };

  const selected = plans.find((plan) => plan.id === selectedPlan) || plans[0];

  return (
    <main className="bg-page">
      <Header />
      <div className="mx-auto flex max-w-site">
        <VendorSidebar
          shopName={vendor?.shopName}
          isApproved={vendor?.isApproved}
          isSuspended={vendor?.isSuspended}
          subtitle="Partner Center"
        />

        <section className="flex-1 p-4 md:p-6">
          <div className="rounded-[8px] bg-card p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="text-[12px] font-semibold uppercase tracking-[1px] text-fb-pink">Fit Bazar Partner Program</div>
                <h1 className="mt-2">Partner Center</h1>
                <p className="mt-2 max-w-[720px] text-[14px] text-text-secondary">
                  Apply for stronger marketplace visibility, campaign priority, Top Shop eligibility, and faster promotion support.
                </p>
              </div>
              <span className={`badge ${vendor?.isPartnered ? "badge-green" : vendor?.partnerStatus === "PENDING" ? "badge-amber" : "badge-orange"}`}>
                {loading ? "Loading" : vendor?.isPartnered ? "Active Partner" : vendor?.partnerStatus || "Not Partnered"}
              </span>
            </div>
            {message ? <p className="mt-3 text-[13px] text-success">{message}</p> : null}
            {error ? <p className="mt-3 text-[13px] text-fb-pink">{error}</p> : null}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="rounded-[8px] border border-border-light bg-card p-5">
              <div className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.12em] text-text-muted">
                <Crown className="h-4 w-4 text-fb-pink" />
                Current Status
              </div>
              <div className="mt-4 space-y-3 text-[14px] text-text-secondary">
                <p><span className="font-semibold text-text-primary">Plan:</span> {vendor?.partnerPlan || "-"}</p>
                <p><span className="font-semibold text-text-primary">Expires:</span> {formatDate(vendor?.partnerExpiresAt)}</p>
                <p><span className="font-semibold text-text-primary">Payment Due:</span> {vendor?.partnerPaymentDue ? formatPriceNpr(vendor.partnerPaymentDue) : "-"}</p>
                <p><span className="font-semibold text-text-primary">Note:</span> {vendor?.partnerPaymentNote || "No payment note yet."}</p>
              </div>
            </div>

            <div className="rounded-[8px] border border-border-light bg-card p-5 lg:col-span-2">
              <div className="grid gap-4 md:grid-cols-2">
                {plans.map((plan) => {
                  const active = selectedPlan === plan.id;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`rounded-[8px] border p-5 text-left transition-shadow ${
                        active ? "border-fb-pink bg-fb-pink-bg shadow-[var(--shadow-sm)]" : "border-border-light bg-[var(--bg-surface)] hover:shadow-[var(--shadow-sm)]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h2 className="text-[18px]">{plan.name}</h2>
                          <p className="mt-1 text-[13px] text-text-muted">{plan.description}</p>
                        </div>
                        {active ? <CheckCircle2 className="h-5 w-5 text-fb-pink" /> : null}
                      </div>
                      <div className="mt-5 text-[28px] font-bold text-[var(--text-price)]">{formatPriceNpr(plan.price)}</div>
                      <p className="mt-1 text-[13px] font-semibold text-text-secondary">{plan.monthly}</p>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 grid gap-4 rounded-[8px] border border-border-light bg-white p-4 md:grid-cols-[1fr_auto] md:items-end">
                <div>
                  <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">Payment note / reference</label>
                  <input
                    value={paymentNote}
                    onChange={(event) => setPaymentNote(event.target.value)}
                    placeholder="Example: Paid via bank transfer, reference number..."
                  />
                  <p className="mt-2 text-[12px] text-text-muted">
                    Selected amount: {formatPriceNpr(selected.price)}. Admin will activate after payment confirmation.
                  </p>
                </div>
                <button type="button" onClick={submitPartnerRequest} disabled={saving || loading} className="btn-primary">
                  {saving ? "Sending..." : vendor?.isPartnered ? "Request Renewal" : "Apply Now"}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {[
              { icon: Sparkles, title: "Homepage visibility", text: "Eligible partner products can be chosen by admin for homepage sections." },
              { icon: BadgePercent, title: "Campaign priority", text: "Partner shops get faster review for offers, seasonal drops, and Top Shop placement." },
              { icon: CalendarDays, title: "Auto expiry", text: "If the plan is not renewed before expiry, partner status is removed automatically." },
              { icon: Clock3, title: "Priority support", text: "Partner requests and promotion issues are easier for admin to identify." },
            ].map((item) => (
              <div key={item.title} className="rounded-[8px] border border-border-light bg-card p-5 md:last:col-span-3 xl:last:col-span-1">
                <item.icon className="h-5 w-5 text-fb-pink" />
                <h3 className="mt-3 text-[15px] font-semibold text-text-primary">{item.title}</h3>
                <p className="mt-2 text-[13px] text-text-secondary">{item.text}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
