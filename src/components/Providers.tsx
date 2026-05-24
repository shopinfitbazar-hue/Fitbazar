"use client";

import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";
import { LanguageProvider } from "@/lib/LanguageContext";
import { CartProvider } from "@/lib/cart";
import { WishlistProvider } from "@/lib/wishlist";
import { ToastProvider } from "@/lib/ToastContext";
import type { Language } from "@/lib/translations";
import { captureMessage } from "@/lib/monitoring";

interface ProvidersProps {
  children: React.ReactNode;
  initialLang?: Language;
}

export default function Providers({ children, initialLang = "en" }: ProvidersProps) {
  useEffect(() => {
    captureMessage("Fit Bazzar app booted", {
      environment: process.env.NODE_ENV,
    });
  }, []);

  return (
    <SessionProvider refetchInterval={300} refetchOnWindowFocus={true}>
      <LanguageProvider initialLang={initialLang}>
        <CartProvider>
          <WishlistProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </WishlistProvider>
        </CartProvider>
      </LanguageProvider>
    </SessionProvider>
  );
}
