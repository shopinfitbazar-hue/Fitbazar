import Link from "next/link";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { formatPriceNpr } from "@/lib/catalog";
import { t, type Language } from "@/lib/translations";

export const dynamic = "force-dynamic";

export default async function AccountReviewsPage() {
  const session = await getServerSession(authOptions);
  const lang = (cookies().get("fitbazar_lang")?.value === "ne" ? "ne" : "en") as Language;

  if (!session?.user?.id) {
    return null;
  }

  const reviews = await prisma.review.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      product: {
        select: {
          id: true,
          slug: true,
          name: true,
          price: true,
          images: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="space-y-4">
      <div className="rounded-[8px] bg-card p-5 shadow-[var(--shadow-sm)]">
        <h1>{t("myReviews", lang)}</h1>
        <p className="mt-2 text-[14px] text-text-muted">
          {t("my_reviews_intro", lang)}
        </p>
      </div>

      <div className="rounded-[8px] bg-card p-5 shadow-[var(--shadow-sm)]">
        {reviews.length ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="rounded-[8px] border border-border-light p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <Link href={`/products/${review.product.slug || review.product.id}`} className="text-[15px] font-semibold text-text-primary hover:text-fb-pink">
                      {review.product.name}
                    </Link>
                    <p className="mt-1 text-[13px] text-text-muted">
                      {formatPriceNpr(review.product.price)} • {new Date(review.createdAt).toLocaleDateString("en-NP")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-[13px] font-semibold text-text-primary">
                    <Star className="h-4 w-4 fill-[#FFC94A] text-[#FFC94A]" />
                    {review.rating.toFixed(1)}
                  </div>
                </div>
                <p className="mt-3 text-[14px] text-text-secondary">
                  {review.comment || t("review_without_comment", lang)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[8px] border border-dashed border-border-light px-4 py-10 text-center">
            <h2 className="text-[18px] font-semibold text-text-primary">{t("no_reviews_yet", lang)}</h2>
            <p className="mt-2 text-[14px] text-text-muted">
              {t("reviews_will_appear_here", lang)}
            </p>
            <Link href="/products" className="btn-primary mt-5 inline-flex">
              {t("browse_products", lang)}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
