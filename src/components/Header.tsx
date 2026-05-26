"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, Menu, Search, ShoppingBag, User, X, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useLanguage } from "@/lib/LanguageContext";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { categoryQueryValue, normalizeCategory } from "@/lib/categories";
import { normalizeAuthCallbackPath } from "@/lib/auth-redirect";
import NotificationBell from "@/components/NotificationBell";

const desktopLinks = [
  { label: "Men", href: `/products?category=${encodeURIComponent(categoryQueryValue("Men"))}` },
  { label: "Women", href: `/products?category=${encodeURIComponent(categoryQueryValue("Women"))}` },
  { label: "Kids", href: `/products?category=${encodeURIComponent(categoryQueryValue("Kids"))}` },
  { label: "Ethnic", href: `/products?category=${encodeURIComponent(categoryQueryValue("Ethnic"))}` },
  { label: "Sports", href: `/products?category=${encodeURIComponent(categoryQueryValue("Sports"))}` },
  { label: "All Sale", href: "/products?minDiscount=20&sort=discount" },
];

const searchSuggestions = [
  "Pashmina shawl",
  "Kurta set",
  "Sports jacket",
  "Wedding ethnic wear",
  "Sneakers",
  "Kids party wear",
];

type HeaderSessionUser = {
  id?: string;
  role?: "ADMIN" | "VENDOR" | "CUSTOMER";
  name?: string | null;
  email?: string | null;
};

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { lang, setLang, t } = useLanguage();
  const { itemCount: bagCount } = useCart();
  const { itemCount: wishlistCount } = useWishlist();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [announcementText, setAnnouncementText] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeCategory, setActiveCategory] = useState("");
  const [saleLinkActive, setSaleLinkActive] = useState(false);
  const [loginCallbackUrl, setLoginCallbackUrl] = useState("/");

  const sessionUser: HeaderSessionUser | null = session?.user ?? null;

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    async function loadAnnouncement() {
      try {
        const response = await fetch("/api/site-settings", { cache: "no-store" });
        const data = await response.json();
        if (response.ok && data.announcementActive && data.announcementBar) {
          setAnnouncementText(data.announcementBar);
          setShowAnnouncement(true);
        } else {
          setAnnouncementText("");
          setShowAnnouncement(false);
        }
      } catch {
        setShowAnnouncement(false);
      }
    }

    void loadAnnouncement();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setActiveCategory(normalizeCategory(params.get("category")));
    setSaleLinkActive(params.get("minDiscount") === "20");
    setLoginCallbackUrl(
      normalizeAuthCallbackPath(`${window.location.pathname}${window.location.search}${window.location.hash}`, "/"),
    );
  }, [pathname]);

  const role = sessionUser?.role;
  const userName = sessionUser?.name || t("welcome");
  const userEmail = sessionUser?.email || "Shop smarter with Fit Bazar";

  const profileLinks = useMemo(() => {
    if (!sessionUser) {
      return {
        header: (
          <>
            <h3 className="text-[14px] font-bold text-text-primary">{t("welcome")}</h3>
            <p className="mt-1 text-[12px] text-text-muted">{t("access_account_manage_orders")}</p>
            <Link href={`/login?callbackUrl=${encodeURIComponent(loginCallbackUrl)}`} className="btn-primary mt-4 block w-full text-center">
              {t("login_signup")}
            </Link>
          </>
        ),
        items: [
          { label: t("wishlist"), href: "/account/wishlist" },
          { label: t("my_orders"), href: "/account/orders" },
          { label: t("help_support"), href: "/help" },
        ],
      };
    }

    if (role === "ADMIN") {
      return {
        header: (
          <>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-[14px] font-bold text-text-primary">{userName}</h3>
                <p className="mt-1 text-[12px] text-text-muted">{userEmail}</p>
              </div>
              <span className="badge badge-pink">{t("admin")}</span>
            </div>
          </>
        ),
        items: [
          { label: t("admin_panel"), href: "/admin" },
          { label: t("notifications"), href: "/account/notifications" },
          { label: t("help_support"), href: "/help" },
          { label: t("logout"), href: "#logout" },
        ],
      };
    }

    if (role === "VENDOR") {
      return {
        header: (
          <>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-[14px] font-bold text-text-primary">{userName}</h3>
                <p className="mt-1 text-[12px] text-text-muted">{userEmail}</p>
              </div>
              <span className="badge badge-green">{t("vendor_account")}</span>
            </div>
          </>
        ),
        items: [
          { label: t("dashboard"), href: "/vendor/dashboard" },
          { label: t("my_products"), href: "/vendor/products" },
          { label: t("my_orders"), href: "/vendor/orders" },
          { label: t("notifications"), href: "/account/notifications" },
          { label: t("help_support"), href: "/help" },
          { label: t("logout"), href: "#logout" },
        ],
      };
    }

    return {
      header: (
        <>
          <h3 className="text-[14px] font-bold text-text-primary">{userName}</h3>
          <p className="mt-1 text-[12px] text-text-muted">{userEmail}</p>
        </>
      ),
      items: [
        { label: t("my_orders"), href: "/account/orders" },
        { label: t("my_profile"), href: "/account/dashboard" },
        { label: t("wishlist"), href: "/account/wishlist" },
        { label: t("notifications"), href: "/account/notifications" },
        { label: t("help_support"), href: "/help" },
        { label: t("logout"), href: "#logout" },
      ],
    };
  }, [loginCallbackUrl, role, sessionUser, t, userEmail, userName]);

  const handleLogout = () => {
    setShowProfileMenu(false);
    setMobileOpen(false);
    router.push("/logout");
  };

  const submitSearch = (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!query.trim()) return;
    setSearchFocused(false);
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const IconLink = ({
    href,
    label,
    badge,
    children,
  }: {
    href: string;
    label: string;
    badge?: number;
    children: React.ReactNode;
  }) => (
    <Link href={href} className="group relative flex flex-col items-center gap-1 text-text-muted hover:text-fb-pink">
      <div className="relative">
        {children}
        {badge && badge > 0 ? (
          <span className="absolute -right-2 -top-1 flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-fb-pink px-1 text-[9px] font-semibold text-white">
            {badge}
          </span>
        ) : null}
      </div>
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );

  return (
    <>
      {showAnnouncement && (
        <div className="relative bg-fb-pink px-10 py-2 text-center text-[12px] text-white">
          <span className="block truncate pr-6 text-white">{announcementText}</span>
          <button
            type="button"
            onClick={() => setShowAnnouncement(false)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white"
            aria-label={t("dismiss_announcement")}
          >
            <X className="h-4 w-4 text-white" />
          </button>
        </div>
      )}

      <header className="sticky top-0 z-[1000] border-b border-border-light bg-card/95 backdrop-blur-md shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <div className="container hidden py-3 lg:block">
          <div className="grid min-h-[72px] grid-cols-[auto_minmax(0,1.2fr)_minmax(260px,0.95fr)_auto] items-center gap-x-4 xl:gap-x-6">
            <Link href="/" className="shrink-0 py-2">
              <div className="text-[24px] font-bold leading-[0.9] tracking-[-0.04em] text-fb-pink">Fit Bazzar</div>
              <div className="mt-1 text-[10px] leading-none text-text-muted">Nepal&apos;s Fashion Store</div>
            </Link>

            <div className="min-w-0 overflow-x-auto [&::-webkit-scrollbar]:hidden">
              <nav className="flex min-w-max items-center gap-5 xl:gap-6">
                {desktopLinks.map((link) => {
                  const linkCategory = normalizeCategory(new URLSearchParams(link.href.split("?")[1] || "").get("category"));
                  const active = linkCategory
                    ? pathname === "/products" && activeCategory === linkCategory
                    : pathname === "/products" && link.href.includes("minDiscount")
                      ? saleLinkActive
                      : pathname === link.href;
                  return (
                    <Link
                      key={link.label}
                      href={link.href}
                      className={`whitespace-nowrap border-b-2 border-transparent py-1 text-[13px] font-medium uppercase tracking-[0.08em] text-text-primary hover:border-fb-pink hover:text-text-primary ${active ? "border-fb-pink" : ""}`}
                    >
                      {link.label === "Sports" ? t("sportswear") : t(link.label.toLowerCase())}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="relative min-w-0 w-full max-w-[480px] justify-self-end">
              <form
                onSubmit={submitSearch}
                className={`flex h-10 w-full items-center gap-2 rounded-[20px] border px-4 ${searchFocused ? "border-fb-pink bg-card" : "border-border-default bg-[#F8F8F8]"}`}
              >
                <Search className="h-4 w-4 text-text-muted" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => window.setTimeout(() => setSearchFocused(false), 120)}
                  placeholder={t("search")}
                  className="min-w-0 flex-1 border-none bg-transparent px-0 py-0 shadow-none focus:border-none"
                />
              </form>
              {searchFocused && (
                <div className="absolute left-0 right-0 top-[46px] z-[1001] overflow-hidden rounded-[8px] border border-border-light bg-card shadow-[var(--shadow-md)]">
                  {searchSuggestions.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onMouseDown={() => {
                        setQuery(item);
                        router.push(`/search?q=${encodeURIComponent(item)}`);
                      }}
                      className="flex w-full items-center justify-between px-4 py-3 text-left text-[13px] text-text-secondary hover:bg-[var(--bg-hover)]"
                    >
                      <span>{item}</span>
                      <ChevronRight className="h-4 w-4 text-text-muted" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex shrink-0 items-center justify-end gap-3 xl:gap-5">
              <button
                type="button"
                onClick={() => setLang(lang === "en" ? "ne" : "en")}
                className="whitespace-nowrap rounded-[20px] border border-border-default bg-[var(--bg-surface)] px-3 py-1 text-[12px] font-medium text-text-secondary"
              >
                EN | नेपाली
              </button>

              {sessionUser ? <NotificationBell /> : null}

              <div
                className="relative"
                onMouseEnter={() => setShowProfileMenu(true)}
                onMouseLeave={() => setShowProfileMenu(false)}
              >
                <button type="button" className="group flex flex-col items-center gap-1 text-text-muted hover:text-fb-pink">
                  <User className="h-[22px] w-[22px]" />
                  <span className="text-[10px] font-medium">{t("profile")}</span>
                </button>
                {showProfileMenu && (
                  <div className="absolute right-0 top-[42px] z-[1001] min-w-[240px] rounded-[8px] border border-border-light bg-card p-4 shadow-[var(--shadow-md)]">
                    {profileLinks.header}
                    <hr className="my-4" />
                    <div className="space-y-3">
                      {profileLinks.items.map((item) =>
                        item.href === "#logout" ? (
                          <button
                            key={item.label}
                            type="button"
                            onClick={handleLogout}
                            className="block text-[13px] font-medium text-text-secondary"
                          >
                            {item.label}
                          </button>
                        ) : (
                          <Link key={item.label} href={item.href} className="block text-[13px] font-medium text-text-secondary">
                            {item.label}
                          </Link>
                        ),
                      )}
                    </div>
                  </div>
                )}
              </div>

              <IconLink href="/account/wishlist" label={t("wishlist")} badge={wishlistCount}>
                <Heart className="h-[22px] w-[22px]" />
              </IconLink>

              <IconLink href="/cart" label={t("bag")} badge={bagCount}>
                <ShoppingBag className="h-[22px] w-[22px]" />
              </IconLink>
            </div>
          </div>
        </div>

        <div className="lg:hidden">
          <div className="container flex h-[58px] items-center gap-2">
            <Link href="/" className="shrink-0 py-2" aria-label="Fit Bazzar home">
              <div className="text-[20px] font-bold leading-none tracking-[-0.04em] text-fb-pink">Fit Bazzar</div>
            </Link>
            <form
              onSubmit={submitSearch}
              className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-[20px] border border-border-default bg-[var(--bg-surface)] px-3"
            >
              <Search className="h-4 w-4 shrink-0 text-text-muted" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("search_label")}
                className="min-w-0 border-none bg-transparent px-0 py-0 text-[13px] shadow-none focus:border-none"
              />
            </form>
            <Link href="/cart" className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border-default bg-[var(--bg-surface)]" aria-label={t("bag")}>
              <ShoppingBag className="h-5 w-5 text-text-primary" />
              {bagCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-fb-pink px-1 text-[9px] font-semibold text-white">
                  {bagCount}
                </span>
              ) : null}
            </Link>
            {sessionUser ? (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border-default bg-[var(--bg-surface)]">
                <NotificationBell />
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border-default bg-[var(--bg-surface)]"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5 text-text-primary" />
            </button>
          </div>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-[1010] bg-black/30 transition-opacity lg:hidden ${mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setMobileOpen(false)}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-[1011] flex h-full w-[80vw] max-w-[320px] flex-col bg-card transition-transform duration-300 ease-out lg:hidden ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="border-b border-border-light p-4">
          {sessionUser ? (
            <>
              <h3 className="text-[16px] font-semibold text-text-primary">{userName}</h3>
              <p className="mt-1 text-[12px] text-text-muted">{userEmail}</p>
            </>
          ) : (
            <>
              <h3 className="text-[16px] font-semibold text-text-primary">{t("welcome")}</h3>
              <p className="mt-1 text-[12px] text-text-muted">{t("login_manage_orders_wishlist")}</p>
              <Link href={`/login?callbackUrl=${encodeURIComponent(loginCallbackUrl)}`} className="btn-primary mt-4 inline-block w-full text-center">
                {t("login_signup")}
              </Link>
            </>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {sessionUser ? (
            <div className="border-b border-border-light pb-2">
              {profileLinks.items.map((item) =>
                item.href === "#logout" ? (
                  <button
                    key={item.label}
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center justify-between px-4 py-4 text-[14px] font-medium text-text-primary"
                  >
                    <span>{item.label}</span>
                    <ChevronRight className="h-4 w-4 text-text-muted" />
                  </button>
                ) : (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between px-4 py-4 text-[14px] font-medium text-text-primary"
                  >
                    <span>{item.label}</span>
                    <ChevronRight className="h-4 w-4 text-text-muted" />
                  </Link>
                ),
              )}
            </div>
          ) : null}

          {desktopLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between px-4 py-4 text-[14px] font-medium text-text-primary"
            >
              <span>{link.label === "Sports" ? t("sportswear") : t(link.label.toLowerCase())}</span>
              <ChevronRight className="h-4 w-4 text-text-muted" />
            </Link>
          ))}
          <Link
            href="/account/wishlist"
            onClick={() => setMobileOpen(false)}
            className="flex items-center justify-between px-4 py-4 text-[14px] font-medium text-text-primary"
          >
            <span>{t("wishlist")}</span>
            <ChevronRight className="h-4 w-4 text-text-muted" />
          </Link>
          <Link
            href="/cart"
            onClick={() => setMobileOpen(false)}
            className="flex items-center justify-between px-4 py-4 text-[14px] font-medium text-text-primary"
          >
            <span>{t("bag")}</span>
            <ChevronRight className="h-4 w-4 text-text-muted" />
          </Link>
          <Link
            href="/help"
            onClick={() => setMobileOpen(false)}
            className="flex items-center justify-between px-4 py-4 text-[14px] font-medium text-text-primary"
          >
            <span>{t("help_support")}</span>
            <ChevronRight className="h-4 w-4 text-text-muted" />
          </Link>
        </div>

        <div className="border-t border-border-light p-4">
          <button
            type="button"
            onClick={() => setLang(lang === "en" ? "ne" : "en")}
            className="rounded-[20px] border border-border-default bg-[var(--bg-surface)] px-3 py-1 text-[12px] font-medium text-text-secondary"
          >
            EN | नेपाली
          </button>
        </div>
      </aside>
    </>
  );
}
