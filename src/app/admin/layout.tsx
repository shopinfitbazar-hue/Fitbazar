import { buildMetadata } from "@/config/site";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildMetadata(
  buildNoIndexMetadata("FitBazar Admin", "Private FitBazar admin workspace.", "/admin"),
);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
