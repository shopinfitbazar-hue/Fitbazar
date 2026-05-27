import { buildMetadata } from "@/config/site";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildMetadata(
  buildNoIndexMetadata("Reset Password", "Set a new password for your FitBazar account.", "/reset-password"),
);

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
