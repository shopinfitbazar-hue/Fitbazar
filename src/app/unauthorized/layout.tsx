import { buildMetadata } from "@/config/site";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildMetadata(
  buildNoIndexMetadata("Unauthorized", "This FitBazar area requires permission.", "/unauthorized"),
);

export default function UnauthorizedLayout({ children }: { children: React.ReactNode }) {
  return children;
}
