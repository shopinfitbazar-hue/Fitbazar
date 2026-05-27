import { buildMetadata } from "@/config/site";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildMetadata(
  buildNoIndexMetadata("Create Account", "Create a FitBazar customer account.", "/signup"),
);

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
