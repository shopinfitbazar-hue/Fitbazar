import { cookies } from "next/headers";
import InfoPageLayout from "@/components/InfoPageLayout";
import { buildMetadata } from "@/config/site";
import { canonicalUrl } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Privacy Policy",
  description:
    "Read how FitBazar handles customer, vendor, order, delivery, and support information for its Nepal fashion marketplace.",
  alternates: {
    canonical: canonicalUrl("/privacy-policy"),
  },
});

export default async function PrivacyPolicyPage() {
  const lang = (await cookies()).get("fitbazar_lang")?.value === "ne" ? "ne" : "en";

  return (
    <InfoPageLayout
      title={lang === "ne" ? "गोपनीयता नीति" : "Privacy Policy"}
      intro={
        lang === "ne"
          ? "हामी तपाईंको व्यक्तिगत जानकारीलाई जिम्मेवारीपूर्वक प्रयोग र सुरक्षित राख्ने प्रयास गर्छौं।"
          : "We handle customer and vendor information responsibly and use it only for operating and improving the marketplace."
      }
      sections={[
        {
          heading: lang === "ne" ? "हामीले के सङ्कलन गर्छौं" : "What We Collect",
          body: [
            lang === "ne"
              ? "खाता जानकारी, अर्डर विवरण, डेलिभरी ठेगाना, र समर्थन सन्देशहरू सेवा सञ्चालनका लागि सङ्कलन गरिन्छ।"
              : "We collect account information, order details, delivery addresses, and support communications to run the platform and fulfill orders.",
          ],
        },
        {
          heading: lang === "ne" ? "यसको प्रयोग" : "How It Is Used",
          body: [
            lang === "ne"
              ? "यो जानकारी अर्डर प्रशोधन, सहायता, विक्रेता समन्वय, र सेवा गुणस्तर सुधारका लागि प्रयोग हुन्छ।"
              : "This information is used for order processing, customer support, vendor coordination, fraud prevention, and service quality improvements.",
          ],
        },
      ]}
    />
  );
}
