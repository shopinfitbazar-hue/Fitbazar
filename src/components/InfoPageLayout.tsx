import Header from "@/components/Header";
import Footer from "@/components/Footer";

type InfoPageLayoutProps = {
  title: string;
  intro: string;
  sections: Array<{
    heading: string;
    body: string[];
  }>;
};

export default function InfoPageLayout({ title, intro, sections }: InfoPageLayoutProps) {
  return (
    <main className="bg-page">
      <Header />
      <div className="container py-8">
        <div className="mx-auto max-w-[860px] rounded-[12px] bg-card p-6 shadow-[var(--shadow-sm)] md:p-8">
          <h1>{title}</h1>
          <p className="mt-3 text-[15px] text-text-secondary">{intro}</p>

          <div className="mt-8 space-y-8">
            {sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-[20px] font-semibold text-text-primary">{section.heading}</h2>
                <div className="mt-3 space-y-3 text-[14px] leading-7 text-text-secondary">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
