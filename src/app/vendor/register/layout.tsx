import { buildMetadata } from "@/config/site";
import { canonicalUrl } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Sell Fashion Online in Nepal",
  description:
    "Apply to become a FitBazar vendor and sell fashion products online to shoppers across Nepal.",
  alternates: {
    canonical: canonicalUrl("/vendor/register"),
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
});

export default function VendorRegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
