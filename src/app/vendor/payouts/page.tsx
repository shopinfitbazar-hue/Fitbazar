"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import VendorSidebar from "@/components/VendorSidebar";
import { formatPriceNpr } from "@/lib/catalog";
import { useLanguage } from "@/lib/LanguageContext";

type PayoutData = {
  vendor: {
    shopName: string;
    isApproved: boolean;
    isSuspended: boolean;
  };
  totals: {
    totalPayout: number;
    released: number;
    pending: number;
  };
  payouts: Array<{
    id: string;
    orderNumber: string;
    amount: number;
    grossAmount: number;
    status: string;
    createdAt: string;
  }>;
};

export default function VendorPayoutsPage() {
  const { t } = useLanguage();
  const [data, setData] = useState<PayoutData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPayouts() {
      const response = await fetch("/api/vendor/payouts", { cache: "no-store" });
      const result = await response.json();
      if (response.ok) {
        setData(result);
      } else {
        setError(result.error || t("vendor_access_unavailable"));
      }
    }

    void loadPayouts();
  }, [t]);

  const statCards = [
    { label: t("total_payout"), value: formatPriceNpr(data?.totals.totalPayout || 0) },
    { label: t("released"), value: formatPriceNpr(data?.totals.released || 0) },
    { label: t("pending"), value: formatPriceNpr(data?.totals.pending || 0) },
  ];

  return (
    <main className="bg-page">
      <Header />
      <div className="mx-auto flex max-w-site">
        <VendorSidebar
          shopName={data?.vendor.shopName}
          isApproved={data?.vendor.isApproved}
          isSuspended={data?.vendor.isSuspended}
          subtitle={t("payouts")}
        />
        <section className="flex-1 p-4 md:p-6">
          <div className="rounded-[8px] bg-card p-5">
            <h1>{t("payouts")}</h1>
            <p className="mt-2 text-[14px] text-text-secondary">{t("payouts_intro")}</p>
            {error ? <p className="mt-3 text-[12px] text-fb-pink">{error}</p> : null}
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {statCards.map((card) => (
              <div key={card.label} className="rounded-[8px] border border-border-light bg-card p-5 shadow-[var(--shadow-sm)]">
                <div className="text-[12px] uppercase tracking-[1px] text-text-muted">{card.label}</div>
                <div className="mt-3 text-[28px] font-bold text-text-primary">{card.value}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-[8px] bg-card p-5">
            <h2 className="text-[16px] font-semibold text-text-primary">{t("payout_history")}</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="border-b border-border-light text-left text-[12px] uppercase tracking-[1px] text-text-muted">
                    <th className="py-3">{t("order_number")}</th>
                    <th className="py-3">{t("gross_sales")}</th>
                    <th className="py-3">{t("vendor_payout")}</th>
                    <th className="py-3">{t("orderStatus")}</th>
                    <th className="py-3">{t("order_date")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.payouts.map((payout) => (
                    <tr key={payout.id} className="border-b border-border-light text-[13px] text-text-secondary last:border-b-0">
                      <td className="py-4 font-medium text-text-primary">{payout.orderNumber}</td>
                      <td>{formatPriceNpr(payout.grossAmount)}</td>
                      <td className="font-medium text-text-primary">{formatPriceNpr(payout.amount)}</td>
                      <td>
                        <span className={`badge ${payout.status === "RELEASED" ? "badge-green" : "badge-orange"}`}>{payout.status}</span>
                      </td>
                      <td>{new Date(payout.createdAt).toLocaleDateString("en-NP")}</td>
                    </tr>
                  ))}
                  {!data?.payouts.length ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-text-muted">{t("no_payouts_yet")}</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
