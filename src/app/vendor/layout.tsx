import { buildMetadata } from "@/config/site";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildMetadata(
  buildNoIndexMetadata("Vendor Workspace", "Private FitBazar vendor workspace.", "/vendor"),
);

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
