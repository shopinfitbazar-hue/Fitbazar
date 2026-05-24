"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";

export default function AccountNotificationsPage() {
  const { t } = useLanguage();
  const notifications = [
    {
      id: "n1",
      title: t("order_update"),
      message: t("order_status_changes_here"),
      href: "/account/orders",
      time: t("just_now"),
    },
    {
      id: "n2",
      title: t("wishlist_alerts"),
      message: t("wishlist_alerts_hint"),
      href: "/account/wishlist",
      time: t("today"),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-[8px] bg-card p-5 shadow-[var(--shadow-sm)]">
        <h1>{t("notifications")}</h1>
        <p className="mt-2 text-[14px] text-text-muted">
          {t("notifications_page_hint")}
        </p>
      </div>

      <div className="rounded-[8px] bg-card p-5 shadow-[var(--shadow-sm)]">
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Link
              key={notification.id}
              href={notification.href}
              className="block rounded-[8px] border border-border-light p-4 transition-shadow hover:shadow-[var(--shadow-sm)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[14px] font-semibold text-text-primary">{notification.title}</div>
                  <p className="mt-1 text-[13px] text-text-secondary">{notification.message}</p>
                </div>
                <span className="text-[12px] text-text-muted">{notification.time}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
