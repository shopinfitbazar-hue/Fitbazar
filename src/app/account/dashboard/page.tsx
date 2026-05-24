"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { 
  User, Package, Heart, MapPin, Settings, LogOut, 
  ChevronRight, DollarSign, ShoppingBag, TrendingUp, Clock
} from "lucide-react";
import { useWishlist } from "@/lib/wishlist";
import { formatPriceNpr } from "@/lib/catalog";
import { useLanguage } from "@/lib/LanguageContext";

const sidebarLinks = [
  { icon: User, labelKey: "dashboard", href: "/account/dashboard" },
  { icon: ShoppingBag, labelKey: "my_orders", href: "/account/orders" },
  { icon: Heart, labelKey: "wishlist", href: "/account/wishlist" },
  { icon: MapPin, labelKey: "addresses", href: "/account/addresses" },
  { icon: Settings, labelKey: "settings", href: "/account/settings" },
];

interface OrderSummary {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  totalAmount: number;
  items: Array<{ id: string }>;
}

interface Profile {
  id: string;
  name: string | null;
  email: string;
  role: string;
  image: string | null;
  phone: string | null;
}

export default function AccountDashboard() {
  const { data: session } = useSession();
  const { itemCount: wishlistItems } = useWishlist();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DELIVERED": return "bg-[var(--green-bg)] text-success";
      case "HANDED_TO_DELIVERY": return "bg-fb-pink-bg text-fb-pink";
      case "PACKED": return "bg-[var(--amber-bg)] text-fb-orange";
      default: return "bg-[var(--bg-surface)] text-text-secondary";
    }
  };

  useEffect(() => {
    async function loadAccount() {
      setLoading(true);
      try {
        const [profileResponse, ordersResponse] = await Promise.all([
          fetch("/api/account/profile", { cache: "no-store" }),
          fetch("/api/orders", { cache: "no-store" }),
        ]);

        const profileData = await profileResponse.json();
        const ordersData = await ordersResponse.json();

        if (profileResponse.ok) setProfile(profileData.user);
        if (ordersResponse.ok) setOrders(ordersData.orders || []);
      } finally {
        setLoading(false);
      }
    }

    void loadAccount();
  }, []);

  const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const pendingOrders = orders.filter((order) => ["PENDING", "RECEIVED", "PACKED", "HANDED_TO_DELIVERY"].includes(order.status)).length;

  return (
    <main className="bg-page">
      <Header />
      
      <div className="container py-8">
        <h1 className="mb-8">{t("account")}</h1>

        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-[8px] bg-card p-6 shadow-[var(--shadow-sm)]">
              <div className="mb-6 flex items-center gap-4 border-b border-border-light pb-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-fb-pink-bg">
                  <User className="h-7 w-7 text-fb-pink" />
                </div>
                <div>
                  <p className="font-semibold text-text-primary">{profile?.name || session?.user?.name || t("fitbazar_shopper")}</p>
                  <p className="text-sm text-text-muted">{profile?.email || session?.user?.email || ""}</p>
                </div>
              </div>

              <nav className="space-y-2">
                {sidebarLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                      link.href === "/account/dashboard"
                        ? "bg-fb-pink-bg text-fb-pink"
                        : "text-text-secondary hover:bg-[var(--bg-hover)]"
                    }`}
                  >
                    <link.icon className="w-5 h-5" />
                    {t(link.labelKey)}
                  </Link>
                ))}
              </nav>

              <button
                type="button"
                onClick={() => void signOut({ callbackUrl: "/" })}
                className="mt-4 flex w-full items-center gap-3 rounded-xl px-4 py-3 font-medium text-fb-pink transition-colors hover:bg-fb-pink-bg"
              >
                <LogOut className="w-5 h-5" />
                {t("logout")}
              </button>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-xl bg-card p-5 shadow-[var(--shadow-sm)]">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-fb-pink-bg">
                  <ShoppingBag className="w-6 h-6 text-fb-pink" />
                </div>
                <p className="text-2xl font-bold text-text-primary">{loading ? "..." : orders.length}</p>
                <p className="text-sm text-text-muted">{t("total_orders")}</p>
              </div>
              <div className="rounded-xl bg-card p-5 shadow-[var(--shadow-sm)]">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--green-bg)]">
                  <DollarSign className="w-6 h-6 text-success" />
                </div>
                <p className="text-2xl font-bold text-text-primary">{loading ? "..." : formatPriceNpr(totalSpent)}</p>
                <p className="text-sm text-text-muted">{t("total_spent")}</p>
              </div>
              <div className="rounded-xl bg-card p-5 shadow-[var(--shadow-sm)]">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-fb-pink-bg">
                  <Heart className="w-6 h-6 text-fb-pink" />
                </div>
                <p className="text-2xl font-bold text-text-primary">{wishlistItems}</p>
                <p className="text-sm text-text-muted">{t("wishlist")}</p>
              </div>
              <div className="rounded-xl bg-card p-5 shadow-[var(--shadow-sm)]">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--amber-bg)]">
                  <Clock className="w-6 h-6 text-fb-orange" />
                </div>
                <p className="text-2xl font-bold text-text-primary">{loading ? "..." : pendingOrders}</p>
                <p className="text-sm text-text-muted">{t("pending_orders")}</p>
              </div>
            </div>

            <div className="rounded-[8px] bg-card p-6 shadow-[var(--shadow-sm)]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[20px] font-semibold text-text-primary">{t("recent_orders")}</h2>
                <Link href="/account/orders" className="flex items-center gap-1 text-sm font-semibold text-fb-pink hover:underline">
                  {t("view_all")} <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="space-y-4">
                {orders.slice(0, 3).map((order) => (
                  <div key={order.id} className="flex items-center justify-between rounded-xl border border-border-light p-4">
                    <div>
                      <p className="font-semibold text-text-primary">{order.orderNumber}</p>
                      <p className="text-sm text-text-muted">{order.items.length} items • {new Date(order.createdAt).toLocaleDateString("en-NP")}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-text-primary">{formatPriceNpr(order.totalAmount)}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
                {!loading && orders.length === 0 ? <p className="text-[14px] text-text-muted">{t("recent_orders_hint")}</p> : null}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Link href="/products" className="flex items-center gap-4 rounded-[8px] bg-card p-6 shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)]">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-fb-pink-bg">
                  <TrendingUp className="w-7 h-7 text-fb-pink" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">{t("continue_shopping")}</h3>
                  <p className="text-sm text-text-muted">{t("latest_arrivals_hint")}</p>
                </div>
              </Link>
              <Link href="/account/addresses" className="flex items-center gap-4 rounded-[8px] bg-card p-6 shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)]">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--green-bg)]">
                  <Package className="w-7 h-7 text-success" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">{t("manage_addresses")}</h3>
                  <p className="text-sm text-text-muted">{t("address_ready_hint")}</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
