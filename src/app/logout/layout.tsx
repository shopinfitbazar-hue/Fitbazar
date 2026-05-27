import { buildMetadata } from "@/config/site";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildMetadata(
  buildNoIndexMetadata("Logout", "Log out of FitBazar.", "/logout"),
);

export default function LogoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
