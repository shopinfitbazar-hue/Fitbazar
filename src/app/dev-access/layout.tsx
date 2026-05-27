import { buildMetadata } from "@/config/site";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildMetadata(
  buildNoIndexMetadata("Developer Access", "FitBazar developer access.", "/dev-access"),
);

export default function DevAccessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
