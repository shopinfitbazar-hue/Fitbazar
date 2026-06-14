"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BadgeCheck,
  BellRing,
  CheckCircle2,
  Clock3,
  Landmark,
  Plane,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Truck,
  type LucideIcon,
} from "lucide-react";
import SmartImage from "@/components/ui/SmartImage";

const launchImage =
  "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1400&q=80";

const perks: Array<{ label: string; detail: string; icon: LucideIcon }> = [
  { label: "Wide range of products", detail: "Fashion, accessories, shoes", icon: ShoppingBag },
  { label: "Best prices in India", detail: "Smart cross-border sourcing", icon: BadgeCheck },
  { label: "Fast delivery to Nepal", detail: "Clear updates from pickup to door", icon: Truck },
];

const trustItems: Array<{ label: string; icon: LucideIcon }> = [
  { label: "100% original products", icon: BadgeCheck },
  { label: "Secure payments", icon: ShieldCheck },
  { label: "Easy returns", icon: Clock3 },
  { label: "Trusted by top brands", icon: CheckCircle2 },
];

type LaunchingSoonPromoProps = {
  mode?: "home" | "page";
};

export default function LaunchingSoonPromo({ mode = "home" }: LaunchingSoonPromoProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const isPage = mode === "page";

  async function submitNotify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) {
      setStatus("error");
      setMessage("Please enter your email.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/launch-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to save your request.");
      }

      setStatus("success");
      setMessage(data.message || "You are on the launch list.");
      setEmail("");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to save your request.");
    }
  }

  return (
    <section
      className={
        isPage
          ? "overflow-hidden rounded-[8px] border border-border-light bg-card shadow-[var(--shadow-card)]"
          : "overflow-hidden rounded-[8px] border border-border-light bg-card shadow-[var(--shadow-card)]"
      }
    >
      <div className={`grid ${isPage ? "lg:grid-cols-[minmax(0,0.9fr)_minmax(380px,0.8fr)]" : "lg:grid-cols-[minmax(0,1fr)_420px]"}`}>
        <div className={`${isPage ? "p-6 md:p-8 lg:p-10" : "p-5 md:p-7"} bg-[linear-gradient(135deg,#fffaf3_0%,#f7efe4_58%,#eef3f6_100%)]`}>
          <div className="inline-flex items-center gap-2 rounded-[4px] bg-[#101827] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-white">
            <Plane className="h-3.5 w-3.5 text-[#d7a864]" />
            Launching Soon
          </div>

          <h2 className={`${isPage ? "mt-5 text-[2rem] md:text-[2.8rem]" : "mt-4 text-[1.55rem] md:text-[2rem]"} max-w-[680px] leading-[0.98] text-[#101827]`}>
            Order From India, Delivered to Nepal
          </h2>
          <p className={`${isPage ? "mt-4 max-w-[620px]" : "mt-3 max-w-[540px]"} text-[14px] leading-6 text-text-secondary`}>
            We are preparing a cleaner cross-border shopping flow with trusted sourcing, transparent delivery updates, and Fit Bazar support from order to doorstep.
          </p>

          <div className={`mt-5 grid gap-3 ${isPage ? "sm:grid-cols-3" : "sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3"}`}>
            {perks.map((item) => (
              <div key={item.label} className="rounded-[8px] border border-border-light bg-white/84 p-3 shadow-[0_10px_28px_rgba(16,24,39,0.05)]">
                <item.icon className="h-5 w-5 text-[#b98745]" strokeWidth={1.8} />
                <p className="mt-3 line-clamp-1 text-[13px] font-semibold text-[#101827]">{item.label}</p>
                <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-text-muted">{item.detail}</p>
              </div>
            ))}
          </div>

          <form onSubmit={submitNotify} className={`${isPage ? "mt-7 max-w-[560px]" : "mt-5 max-w-[520px]"} grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]`}>
            <label className="sr-only" htmlFor={isPage ? "launch-email-page" : "launch-email-home"}>
              Email address
            </label>
            <input
              id={isPage ? "launch-email-page" : "launch-email-home"}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email address"
              className="h-12 rounded-[4px] bg-white"
              autoComplete="email"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="flex h-12 items-center justify-center gap-2 rounded-[4px] bg-[#101827] px-6 text-[12px] font-semibold uppercase tracking-[0.1em] text-white shadow-[0_14px_28px_rgba(17,24,39,0.16)] disabled:opacity-70"
            >
              <BellRing className="h-4 w-4 text-[#d7a864]" />
              {status === "loading" ? "Saving" : "Notify me"}
            </button>
          </form>
          {message ? (
            <p className={`mt-3 text-[13px] font-semibold ${status === "success" ? "text-success" : "text-fb-pink"}`}>{message}</p>
          ) : null}

          {isPage ? (
            <div className="mt-8 grid gap-3 border-t border-border-light pt-5 sm:grid-cols-2 lg:grid-cols-4">
              {trustItems.map((item) => (
                <div key={item.label} className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#b98745] shadow-[var(--shadow-sm)]">
                    <item.icon className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#101827]">{item.label}</span>
                </div>
              ))}
            </div>
          ) : (
            <Link href="/launching-soon" className="mt-5 inline-flex text-[12px] font-semibold uppercase tracking-[0.08em] text-[#101827] hover:text-fb-pink">
              View launch page
            </Link>
          )}
        </div>

        <div className={`${isPage ? "min-h-[360px]" : "min-h-[220px]"} relative overflow-hidden bg-[#101827]`}>
          <SmartImage
            src={launchImage}
            alt="India delivery launching soon"
            fill
            sizes={isPage ? "(max-width: 1023px) 100vw, 44vw" : "(max-width: 1023px) 100vw, 420px"}
            className="object-cover opacity-[0.88]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,24,39,0.02)_0%,rgba(17,24,39,0.58)_100%)]" />
          <div className="absolute left-5 top-5 flex items-center gap-2 rounded-[4px] bg-white/88 px-3 py-2 text-[12px] font-semibold text-[#101827] shadow-[var(--shadow-sm)] backdrop-blur-md">
            <Plane className="h-4 w-4 text-[#b98745]" />
            India to Nepal
          </div>
          <div className="absolute bottom-5 left-5 right-5 rounded-[8px] border border-white/20 bg-white/88 p-4 shadow-[var(--shadow-card)] backdrop-blur-md">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[6px] bg-[#101827] text-white">
                <Landmark className="h-5 w-5 text-[#d7a864]" strokeWidth={1.8} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold text-[#101827]">Premium cross-border shopping</p>
                <p className="mt-1 line-clamp-2 text-[12px] leading-4 text-text-muted">Built for fashion, accessories, shoes, and trusted delivery updates.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isPage ? (
        <div className="grid border-t border-border-light bg-[#101827] px-5 py-4 text-white sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Android ready", icon: Smartphone },
            { label: "iOS ready", icon: Smartphone },
            { label: "Vendor dashboard", icon: ShoppingBag },
            { label: "Admin controls", icon: ShieldCheck },
          ].map((item) => (
            <div key={item.label} className="flex min-w-0 items-center gap-3 py-2">
              <item.icon className="h-5 w-5 shrink-0 text-[#d7a864]" strokeWidth={1.8} />
              <span className="truncate text-[13px] font-semibold text-white">{item.label}</span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
