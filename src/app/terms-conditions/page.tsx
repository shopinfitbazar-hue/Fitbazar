import { cookies } from "next/headers";
import InfoPageLayout from "@/components/InfoPageLayout";
import { buildMetadata } from "@/config/site";
import { canonicalUrl } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Terms and Conditions",
  description:
    "Read FitBazar marketplace terms for customers, vendors, orders, product listings, and platform usage in Nepal.",
  alternates: {
    canonical: canonicalUrl("/terms-conditions"),
  },
});

export default async function TermsConditionsPage() {
  const lang = (await cookies()).get("fitbazar_lang")?.value === "ne" ? "ne" : "en";

  return (
    <InfoPageLayout
      title={lang === "ne" ? "सर्त तथा नियम" : "Terms & Conditions"}
      intro={
        lang === "ne"
          ? "Fit Bazar प्रयोग गर्दा ग्राहक, विक्रेता, र एडमिनले प्लेटफर्म नियमहरू पालना गर्नुपर्छ।"
          : "Customers, vendors, and administrators are expected to follow marketplace rules while using Fit Bazar."
      }
      sections={[
        {
          heading: lang === "ne" ? "ग्राहक जिम्मेवारी" : "Customer Responsibilities",
          body: [
            lang === "ne"
              ? "सही डेलिभरी जानकारी, वैध अर्डर, र सम्मानजनक व्यवहार आवश्यक हुन्छ।"
              : "Customers must provide accurate delivery details, place valid orders, and use the marketplace respectfully.",
          ],
        },
        {
          heading: lang === "ne" ? "विक्रेता जिम्मेवारी" : "Vendor Responsibilities",
          body: [
            lang === "ne"
              ? "विक्रेताले सही उत्पादन जानकारी, समयमै अर्डर पुष्टि, र नीति अनुरूप सञ्चालन गर्नुपर्छ।"
              : "Vendors must provide accurate product information, confirm orders on time, and operate in line with platform policies.",
          ],
        },
      ]}
    />
  );
}
