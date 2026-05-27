import { buildMetadata } from "@/config/site";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildMetadata(
  buildNoIndexMetadata("Shopping Bag", "Review your FitBazar shopping bag before checkout.", "/cart"),
);

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
