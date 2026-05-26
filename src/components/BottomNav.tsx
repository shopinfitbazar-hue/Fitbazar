"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Grid3X3, Home, LayoutDashboard, Package, Search, Settings, ShoppingBag, User, WalletCards } from "lucide-react";
import { useSession } from "next-auth/react";
import { useCart } from "@/lib/cart";
import { useLanguage } from "@/lib/LanguageContext";

type BottomNavItem = {
  href: string;
  icon: typeof Home;
  labelKey: string;
  badgeKey?: "bag";
};

const customerItems: BottomNavItem[] = [
  { href: "/", icon: Home, labelKey: "home" },
  { href: "/search", icon: Search, labelKey: "search_label" },
  { href: "/products", icon: Grid3X3, labelKey: "category" },
  { href: "/cart", icon: ShoppingBag, labelKey: "bag", badgeKey: "bag" },
  { href: "/account/dashboard", icon: User, labelKey: "profile" },
];

const vendorItems: BottomNavItem[] = [
  { href: "/vendor/dashboard", icon: LayoutDashboard, labelKey: "dashboard" },
  { href: "/vendor/products", icon: Package, labelKey: "products" },
  { href: "/vendor/orders", icon: ShoppingBag, labelKey: "orders" },
  { href: "/vendor/payouts", icon: WalletCards, labelKey: "payouts" },
  { href: "/vendor/settings", icon: Settings, labelKey: "settings" },
];

const adminItems: BottomNavItem[] = [
  { href: "/admin", icon: LayoutDashboard, labelKey: "admin_panel" },
  { href: "/admin#orders", icon: ShoppingBag, labelKey: "orders" },
  { href: "/admin#products", icon: Package, labelKey: "products" },
  { href: "/admin#customers", icon: User, labelKey: "customers" },
  { href: "/account/notifications", icon: Bell, labelKey: "notifications" },
];

export default function BottomNav() {
  const pathname = usePathname() ?? "";
  const { itemCount } = useCart();
  const { t } = useLanguage();
  const { data: session } = useSession();
  const role = session?.user?.role;
  const items = role === "VENDOR" ? vendorItems : role === "ADMIN" ? adminItems : customerItems;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-[1000] border-t border-border-light bg-card lg:hidden">
      <div className="mx-auto flex h-12 max-w-site items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const badge = item.badgeKey === "bag" ? itemCount : 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex h-full w-full flex-col items-center justify-center gap-0.5 ${
                active ? "text-fb-pink" : "text-text-muted"
              }`}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {badge > 0 && (
                  <span className="absolute -right-2 -top-1 flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-fb-pink px-1 text-[9px] font-semibold text-white">
                    {badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">
                {t(item.labelKey)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
