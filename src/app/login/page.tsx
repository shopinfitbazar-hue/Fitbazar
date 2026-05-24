import LoginPageClient from "@/components/LoginPageClient";
import { authMeta } from "@/lib/auth";

export default function LoginPage() {
  return <LoginPageClient googleEnabled={authMeta.hasGoogleOAuth} />;
}
