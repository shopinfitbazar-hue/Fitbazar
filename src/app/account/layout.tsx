"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  ClipboardList, 
  Heart, 
  User, 
  MapPin, 
  Star,
  Settings,
  MessageSquareText,
} from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

const menuItems = [
  { href: "/account/orders", labelKey: "my_orders", icon: ClipboardList },
  { href: "/account/wishlist", labelKey: "wishlist", icon: Heart },
  { href: "/account/dashboard", labelKey: "profile", icon: User },
  { href: "/account/addresses", labelKey: "addresses", icon: MapPin },
  { href: "/account/reviews", labelKey: "myReviews", icon: Star },
  { href: "/account/support", labelKey: "help_support", icon: MessageSquareText },
  { href: "/account/settings", labelKey: "settings", icon: Settings },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-8 md:flex-row">
        <aside className="shrink-0 md:w-64">
          <nav className="sticky top-24 rounded-[8px] border border-border-light bg-card p-4">
            <h2 className="mb-4 px-3 text-[20px] font-semibold text-text-primary">{t("profile")}</h2>
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                        isActive 
                          ? "bg-fb-pink-bg text-fb-pink font-medium" 
                          : "text-text-secondary hover:bg-[var(--bg-hover)]"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {t(item.labelKey)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
