import { cookies } from "next/headers";
import InfoPageLayout from "@/components/InfoPageLayout";
import { buildMetadata } from "@/config/site";
import { canonicalUrl } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "About FitBazar",
  description:
    "Learn about FitBazar, a Nepal-focused multivendor fashion marketplace connecting shoppers with trusted local stores.",
  alternates: {
    canonical: canonicalUrl("/about-us"),
  },
});

export default async function AboutUsPage() {
  const lang = (await cookies()).get("fitbazar_lang")?.value === "ne" ? "ne" : "en";

  return (
    <InfoPageLayout
      title={lang === "ne" ? "हाम्रो बारेमा" : "About Fit Bazar"}
      intro={
        lang === "ne"
          ? "Fit Bazar नेपालको बहु-विक्रेता फेसन मार्केटप्लेस हो जहाँ ग्राहकले भरपर्दा पसलबाट सजिलै किनमेल गर्न सक्छन्।"
          : "Fit Bazar is a Nepal-focused multivendor fashion marketplace built to help customers shop confidently from trusted stores."
      }
      sections={[
        {
          heading: lang === "ne" ? "हाम्रो लक्ष्य" : "Our Mission",
          body: [
            lang === "ne"
              ? "हामी स्थानीय र विश्वसनीय पसलहरूलाई एउटै प्लेटफर्ममा ल्याएर राम्रो किनमेल अनुभव दिन चाहन्छौं।"
              : "We bring trusted local stores together in one place so customers can discover quality fashion with a smoother shopping experience.",
          ],
        },
        {
          heading: lang === "ne" ? "हामी कसरी काम गर्छौं" : "How We Work",
          body: [
            lang === "ne"
              ? "प्रत्येक विक्रेता अनुमोदन, समीक्षा, र सञ्चालन नियमको अधीनमा हुन्छ ताकि अर्डर, डेलिभरी, र ग्राहक सहायता विश्वसनीय रहोस्।"
              : "Every vendor goes through approval, operational checks, and policy enforcement so orders, delivery, and customer support stay dependable.",
          ],
        },
      ]}
    />
  );
}
