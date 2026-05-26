"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Bell, Package, ShoppingBag, Heart, Clock } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { getSafeHref } from "@/lib/media";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export default function NotificationBell() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    let active = true;
    async function loadNotifications() {
      try {
        const response = await fetch("/api/notifications", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { notifications?: Notification[] };
        if (active) setNotifications(data.notifications || []);
      } catch {
        if (active) setNotifications([]);
      }
    }

    void loadNotifications();
    const interval = window.setInterval(() => {
      void loadNotifications();
    }, 30000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void loadNotifications();
      }
    };

    window.addEventListener("focus", loadNotifications);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", loadNotifications);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications((current) => current.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    void fetch(`/api/notifications/${id}`, { method: "PATCH" });
  };

  const markAllAsRead = () => {
    setNotifications((current) => current.map((n) => ({ ...n, isRead: true })));
    void fetch("/api/notifications", { method: "PATCH" });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ORDER': return <Package className="w-5 h-5" />;
      case 'WISHLIST': return <Heart className="w-5 h-5" />;
      case 'PROMOTION':
      case 'ADMIN':
      case 'PRODUCT':
      case 'SUPPORT':
        return <ShoppingBag className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return t("just_now");
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return t("yesterday");
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-text-secondary transition-colors hover:text-fb-pink"
        aria-label={t("notifications")}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-fb-pink text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-[12px] border border-border-light bg-card shadow-[var(--shadow-md)]">
          <div className="flex items-center justify-between border-b border-border-light p-4">
            <h3 className="font-bold text-text-primary">{t("notifications")}</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-bold text-fb-pink hover:underline"
              >
                {t("mark_all_as_read")}
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-text-muted">
                <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>{t("no_notifications")}</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <Link
                  key={notification.id}
                  href={getSafeHref(notification.link, "/account/notifications")}
                  className={`block border-b border-border-light p-4 transition-colors hover:bg-[var(--bg-hover)] ${
                    !notification.isRead ? "bg-fb-pink-bg/50" : ""
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      notification.type === "ORDER" ? "bg-fb-pink-bg text-fb-pink" :
                      notification.type === "WISHLIST" ? "bg-[var(--green-bg)] text-success" :
                      notification.type === "PROMOTION" || notification.type === "ADMIN" || notification.type === "PRODUCT" || notification.type === "SUPPORT" ? "bg-[var(--amber-bg)] text-fb-orange" :
                      "bg-[var(--bg-surface)] text-text-secondary"
                    }`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-bold text-text-primary">{notification.title}</p>
                        {!notification.isRead && (
                          <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-fb-pink" />
                        )}
                      </div>
                      <p className="line-clamp-2 text-xs text-text-secondary">{notification.message}</p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-text-muted">
                        <Clock className="w-3 h-3" />
                        {getTimeAgo(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          <div className="border-t border-border-light p-3">
            <Link
              href="/account/notifications"
              className="block text-center text-sm font-bold text-fb-pink hover:underline"
            >
              {t("view_all_notifications")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
