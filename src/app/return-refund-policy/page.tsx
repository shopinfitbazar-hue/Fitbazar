import { cookies } from "next/headers";
import InfoPageLayout from "@/components/InfoPageLayout";
import { buildMetadata } from "@/config/site";
import { canonicalUrl } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Return and Refund Policy",
  description:
    "Review FitBazar return and refund guidance for orders, damaged products, seller policies, and support requests in Nepal.",
  alternates: {
    canonical: canonicalUrl("/return-refund-policy"),
  },
});

export default async function ReturnRefundPolicyPage() {
  const lang = (await cookies()).get("fitbazar_lang")?.value === "ne" ? "ne" : "en";

  return (
    <InfoPageLayout
      title={lang === "ne" ? "फिर्ता तथा रिफन्ड नीति" : "Return & Refund Policy"}
      intro={
        lang === "ne"
          ? "रिटर्न र रिफन्ड अनुरोध अर्डर स्थिति, उत्पादन अवस्था, र लागू विक्रेता नीतिमा निर्भर हुन्छ।"
          : "Return and refund eligibility depends on order status, product condition, and the applicable seller policy."
      }
      sections={[
        {
          heading: lang === "ne" ? "रिटर्न कहिले गर्न सकिन्छ" : "When Returns Are Allowed",
          body: [
            lang === "ne"
              ? "गलत उत्पादन, क्षतिग्रस्त सामग्री, वा स्वीकृत नीतिभित्रको समस्यामा रिटर्न अनुरोध गर्न सकिन्छ।"
              : "Returns may be requested for wrong items, damaged goods, or issues that fall within the approved seller policy window.",
          ],
        },
        {
          heading: lang === "ne" ? "सहायता कसरी लिने" : "How To Get Help",
          body: [
            lang === "ne"
              ? "Help & Support बाट अर्डर नम्बर सहित अनुरोध पठाउनुहोस् ताकि हाम्रो टोलीले छिटो सहायता गर्न सकोस्।"
              : "Open a Help & Support request with your order number so the team can review the case and guide the next step.",
          ],
        },
      ]}
    />
  );
}
