import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { cookies } from "next/headers";
import "./globals.css";
import Providers from "@/components/Providers";
import BackToTop from "@/components/BackToTop";
import type { Language } from "@/lib/translations";
import { buildMetadata } from "@/config/site";

const fitBazarSans = localFont({
  src: [
    {
      path: "./fonts/GeistVF.woff",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-assistant",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f5efe8",
  colorScheme: "light",
};

export const metadata: Metadata = buildMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = cookies();
  const langCookie = cookieStore.get("fitbazar_lang")?.value;
  const initialLang: Language = langCookie === "ne" ? "ne" : "en";

  return (
    <html lang={initialLang}>
      <body className={`${fitBazarSans.variable} bg-page font-sans text-text-primary antialiased`}>
        <Providers initialLang={initialLang}>
          {children}
          <BackToTop />
        </Providers>
      </body>
    </html>
  );
}
