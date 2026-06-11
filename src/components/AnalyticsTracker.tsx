"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const ANONYMOUS_ID_KEY = "fitbazar.analytics.anonymousId";

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getAnonymousId() {
  try {
    const existing = window.localStorage.getItem(ANONYMOUS_ID_KEY);
    if (existing) return existing;

    const next = createId();
    window.localStorage.setItem(ANONYMOUS_ID_KEY, next);
    return next;
  } catch {
    return createId();
  }
}

function getChannel(path: string) {
  if (path.startsWith("/admin")) return "ADMIN";
  return "WEB";
}

function postAnalytics(payload: Record<string, unknown>) {
  const body = JSON.stringify({
    anonymousId: getAnonymousId(),
    ...payload,
  });

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    if (navigator.sendBeacon("/api/analytics/track", blob)) return;
  }

  void fetch("/api/analytics/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
}

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || typeof window === "undefined") return;

    const path = `${pathname}${window.location.search}`;
    const referrer = lastPathRef.current || document.referrer || undefined;
    lastPathRef.current = path;

    postAnalytics({
      channel: getChannel(path),
      eventType: "page_view",
      path,
      referrer,
      metadata: {
        title: document.title,
      },
    });
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const reportLoadMetric = () => {
      const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      if (!navigation?.duration) return;

      const path = `${window.location.pathname}${window.location.search}`;
      postAnalytics({
        channel: getChannel(path),
        path,
        metricName: "page_load_ms",
        value: Math.round(navigation.duration),
        unit: "ms",
        metadata: {
          domContentLoadedMs: Math.round(navigation.domContentLoadedEventEnd),
          responseMs: Math.round(navigation.responseEnd - navigation.requestStart),
        },
      });
    };

    if (document.readyState === "complete") {
      window.setTimeout(reportLoadMetric, 0);
      return;
    }

    window.addEventListener("load", reportLoadMetric, { once: true });
    return () => window.removeEventListener("load", reportLoadMetric);
  }, []);

  return null;
}
