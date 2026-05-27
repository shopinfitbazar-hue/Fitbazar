import { buildMetadata } from "@/config/site";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildMetadata(
  buildNoIndexMetadata("Order Confirmation", "View your FitBazar order confirmation.", "/order-confirmation"),
);

export default function OrderConfirmationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
