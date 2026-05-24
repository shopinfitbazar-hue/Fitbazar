import Link from "next/link";
import { cookies } from "next/headers";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { t, type Language } from "@/lib/translations";

export default function NotFound() {
  const lang = (cookies().get("fitbazar_lang")?.value === "ne" ? "ne" : "en") as Language;

  return (
    <main className="bg-page">
      <Header />
      <div className="container py-12">
        <div className="mx-auto max-w-[560px] rounded-[8px] bg-card p-10 text-center shadow-[var(--shadow-sm)]">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-fb-pink-bg text-[28px] font-bold text-fb-pink">
            404
          </div>
          <h1 className="mt-5">{t("page_not_found", lang)}</h1>
          <p className="mt-3 text-[14px] text-text-muted">
            {t("page_not_found_message", lang)}
          </p>
          <div className="mt-6 flex justify-center">
            <Link href="/" className="btn-primary">
              {t("back_home", lang)}
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
