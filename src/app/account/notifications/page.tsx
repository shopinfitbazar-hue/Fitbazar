"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";
import { getSafeHref } from "@/lib/media";

type Notification = {
  id: string;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
};

export default function AccountNotificationsPage() {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNotifications() {
      setLoading(true);
      try {
        const response = await fetch("/api/notifications", { cache: "no-store" });
        const data = (await response.json()) as { notifications?: Notification[] };
        if (response.ok) {
          setNotifications(data.notifications || []);
        }
      } finally {
        setLoading(false);
      }
    }

    void loadNotifications();
  }, []);

  return (
    <div className="space-y-4">
      <div className="rounded-[8px] bg-card p-5 shadow-[var(--shadow-sm)]">
        <h1>{t("notifications")}</h1>
        <p className="mt-2 text-[14px] text-text-muted">
          {t("notifications_page_hint")}
        </p>
      </div>

      <div className="rounded-[8px] bg-card p-5 shadow-[var(--shadow-sm)]">
        {loading ? (
          <p className="text-[13px] text-text-muted">Loading notifications...</p>
        ) : notifications.length ? (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Link
              key={notification.id}
              href={getSafeHref(notification.link, "/account/notifications")}
              className={`block rounded-[8px] border border-border-light p-4 transition-shadow hover:shadow-[var(--shadow-sm)] ${notification.isRead ? "" : "bg-fb-pink-bg/50"}`}
              onClick={() => {
                setNotifications((current) => current.map((item) => (item.id === notification.id ? { ...item, isRead: true } : item)));
                void fetch(`/api/notifications/${notification.id}`, { method: "PATCH" });
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[14px] font-semibold text-text-primary">{notification.title}</div>
                  <p className="mt-1 text-[13px] text-text-secondary">{notification.message}</p>
                </div>
                <span className="text-[12px] text-text-muted">{new Date(notification.createdAt).toLocaleDateString("en-NP")}</span>
              </div>
            </Link>
          ))}
        </div>
        ) : (
          <p className="text-[13px] text-text-muted">{t("no_notifications")}</p>
        )}
      </div>
    </div>
  );
}
