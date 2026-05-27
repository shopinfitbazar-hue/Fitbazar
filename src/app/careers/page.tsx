import { cookies } from "next/headers";
import InfoPageLayout from "@/components/InfoPageLayout";
import { buildMetadata } from "@/config/site";
import { canonicalUrl } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Careers",
  description:
    "Explore career and future collaboration opportunities with FitBazar as we build a stronger fashion marketplace for Nepal.",
  alternates: {
    canonical: canonicalUrl("/careers"),
  },
});

export default async function CareersPage() {
  const lang = (await cookies()).get("fitbazar_lang")?.value === "ne" ? "ne" : "en";

  return (
    <InfoPageLayout
      title={lang === "ne" ? "क्यारियर" : "Careers"}
      intro={
        lang === "ne"
          ? "हामी नेपालमा राम्रो मार्केटप्लेस अनुभव निर्माण गर्न उत्साही व्यक्तिहरू खोजिरहेका छौं।"
          : "We are building a stronger marketplace experience for Nepal and welcome people who care about commerce, design, and operations."
      }
      sections={[
        {
          heading: lang === "ne" ? "अवसर" : "Opportunities",
          body: [
            lang === "ne"
              ? "हाल उपलब्ध भूमिका वा भविष्यका अवसरबारे जानकारीका लागि support@fitbazar.com मा सम्पर्क गर्नुहोस्।"
              : "For current roles or future opportunities, please contact support@fitbazar.com with your background and area of interest.",
          ],
        },
      ]}
    />
  );
}
