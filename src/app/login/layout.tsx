import { buildMetadata } from "@/config/site";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildMetadata(
  buildNoIndexMetadata("Login", "Log in to your FitBazar account.", "/login"),
);

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
