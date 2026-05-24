import { cookies } from "next/headers";
import InfoPageLayout from "@/components/InfoPageLayout";

export default async function PressPage() {
  const lang = (await cookies()).get("fitbazar_lang")?.value === "ne" ? "ne" : "en";

  return (
    <InfoPageLayout
      title={lang === "ne" ? "प्रेस" : "Press"}
      intro={
        lang === "ne"
          ? "मिडिया वा प्रेस सम्बन्धी अनुरोधका लागि हामीसँग औपचारिक रूपमा सम्पर्क गर्न सक्नुहुन्छ।"
          : "Media and press requests can be coordinated through our support and business contact channels."
      }
      sections={[
        {
          heading: lang === "ne" ? "मिडिया सम्पर्क" : "Media Contact",
          body: [
            lang === "ne"
              ? "प्रेस अनुरोधका लागि विषय उल्लेख गरी support@fitbazar.com मा इमेल पठाउनुहोस्।"
              : "For press enquiries, email support@fitbazar.com with your publication, request details, and deadline.",
          ],
        },
      ]}
    />
  );
}
