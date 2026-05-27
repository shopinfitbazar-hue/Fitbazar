import { buildMetadata } from "@/config/site";
import { canonicalUrl } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Help and Support",
  description:
    "Get FitBazar help for orders, delivery, returns, account questions, vendor issues, and customer support in Nepal.",
  alternates: {
    canonical: canonicalUrl("/help"),
  },
});

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
