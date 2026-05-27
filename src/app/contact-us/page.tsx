import { cookies } from "next/headers";
import InfoPageLayout from "@/components/InfoPageLayout";
import { buildMetadata } from "@/config/site";
import { canonicalUrl } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Contact FitBazar",
  description:
    "Contact FitBazar for order support, delivery questions, returns, vendor issues, and marketplace partnerships in Nepal.",
  alternates: {
    canonical: canonicalUrl("/contact-us"),
  },
});

export default async function ContactUsPage() {
  const lang = (await cookies()).get("fitbazar_lang")?.value === "ne" ? "ne" : "en";

  return (
    <InfoPageLayout
      title={lang === "ne" ? "सम्पर्क गर्नुहोस्" : "Contact Us"}
      intro={
        lang === "ne"
          ? "अर्डर, डेलिभरी, रिटर्न, वा विक्रेतासँग सम्बन्धित सहयोगका लागि हामीलाई सम्पर्क गर्नुहोस्।"
          : "Reach us for help with orders, delivery, returns, vendor issues, or general marketplace questions."
      }
      sections={[
        {
          heading: lang === "ne" ? "समर्थन" : "Support",
          body: [
            lang === "ne"
              ? "सामान्य ग्राहक सहायता, अर्डर समस्या, र रिटर्नका लागि Help & Support पृष्ठ प्रयोग गर्नुहोस्।"
              : "For customer support, order issues, and returns, please use the Help & Support page inside the app.",
            lang === "ne"
              ? "इमेल: support@fitbazar.com"
              : "Email: support@fitbazar.com",
          ],
        },
        {
          heading: lang === "ne" ? "व्यावसायिक साझेदारी" : "Business & Partnerships",
          body: [
            lang === "ne"
              ? "विक्रेता आवेदन वा साझेदारीको जानकारीका लागि Vendor Registration पृष्ठ प्रयोग गर्नुहोस्।"
              : "For vendor onboarding or partnership discussions, please use the vendor registration flow and support team follow-up.",
          ],
        },
      ]}
    />
  );
}
