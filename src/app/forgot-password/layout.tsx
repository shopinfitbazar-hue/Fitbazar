import { buildMetadata } from "@/config/site";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildMetadata(
  buildNoIndexMetadata("Forgot Password", "Reset your FitBazar account password.", "/forgot-password"),
);

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
