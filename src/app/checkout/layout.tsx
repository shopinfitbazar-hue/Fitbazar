import { buildMetadata } from "@/config/site";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildMetadata(
  buildNoIndexMetadata("Checkout", "Complete your FitBazar order securely.", "/checkout"),
);

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
