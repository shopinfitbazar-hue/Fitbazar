import { buildMetadata } from "@/config/site";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildMetadata(
  buildNoIndexMetadata("Verify Email", "Verify your FitBazar account email address.", "/verify-email"),
);

export default function VerifyEmailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
