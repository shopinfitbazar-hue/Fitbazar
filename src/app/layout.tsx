import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Providers from "@/components/Providers";
import BackToTop from "@/components/BackToTop";
import BottomNav from "@/components/BottomNav";
import JsonLd from "@/components/JsonLd";
import { buildMetadata } from "@/config/site";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { Analytics } from "@vercel/analytics/next";

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
  return (
    <html lang="en">
      <body className={`${fitBazarSans.variable} bg-page font-sans text-text-primary antialiased`}>
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
        <Providers initialLang="en">
          {children}
          <BackToTop />
          <BottomNav />
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
