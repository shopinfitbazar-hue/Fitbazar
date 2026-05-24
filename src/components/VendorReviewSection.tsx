"use client";

import { useCallback, useEffect, useState } from "react";
import { Star } from "lucide-react";
import { useSession } from "next-auth/react";
import { useLanguage } from "@/lib/LanguageContext";

type VendorReview = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    image?: string | null;
  };
};

type VendorReviewSectionProps = {
  vendorId: string;
};

export default function VendorReviewSection({ vendorId }: VendorReviewSectionProps) {
  const { t } = useLanguage();
  const { status } = useSession();
  const [reviews, setReviews] = useState<VendorReview[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [canReview, setCanReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const loadReviews = useCallback(async () => {
    const response = await fetch(`/api/vendor-reviews?vendorId=${encodeURIComponent(vendorId)}`, { cache: "no-store" });
    const data = await response.json();
    if (response.ok) {
      setReviews(data.reviews || []);
      setAverageRating(data.summary?.averageRating || 0);
      setReviewCount(data.summary?.reviewCount || 0);
      setCanReview(Boolean(data.canReview));
    }
  }, [vendorId]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews, status]);

  const submitReview = async () => {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/vendor-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId, rating, comment }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || t("failed_to_submit_review"));
        return;
      }
      setComment("");
      setCanReview(false);
      setMessage(t("vendor_review_submitted"));
      await loadReviews();
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="section mt-4 rounded-[8px]">
      <div className="mb-4 px-4 md:px-6">
        <h2>{t("vendor_reviews")}</h2>
        <p className="mt-1 text-[13px] text-text-muted">
          {averageRating ? `${averageRating.toFixed(1)} / 5` : "0 / 5"} • {reviewCount} {t("reviews")}
        </p>
      </div>

      {canReview ? (
        <div className="mx-4 rounded-[8px] border border-border-light bg-card p-4 md:mx-6">
          <div className="flex flex-wrap items-center gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button key={value} type="button" onClick={() => setRating(value)} className="text-[#FFC94A]">
                <Star className={`h-5 w-5 ${value <= rating ? "fill-[#FFC94A]" : ""}`} />
              </button>
            ))}
          </div>
          <textarea
            rows={4}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder={t("share_vendor_experience")}
            className="mt-3"
          />
          <div className="mt-3 flex items-center gap-3">
            <button type="button" onClick={submitReview} className="btn-primary" disabled={saving}>
              {saving ? `${t("save")}...` : t("submit_review")}
            </button>
            {message ? <span className="text-[13px] text-text-secondary">{message}</span> : null}
          </div>
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 px-4 md:px-6">
        {reviews.length ? (
          reviews.map((review) => (
            <div key={review.id} className="rounded-[8px] border border-border-light bg-card p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[15px] font-semibold text-text-primary">{review.user.name || t("fitbazar_shopper")}</div>
                  <div className="mt-1 text-[12px] text-text-muted">{new Date(review.createdAt).toLocaleDateString("en-NP")}</div>
                </div>
                <div className="flex items-center gap-1 text-[#FFC94A]">
                  <Star className="h-4 w-4 fill-[#FFC94A]" />
                  <span className="text-[13px] font-semibold">{review.rating}</span>
                </div>
              </div>
              <p className="mt-3 text-[14px] text-text-secondary">{review.comment || t("review_without_comment")}</p>
            </div>
          ))
        ) : (
          <div className="rounded-[8px] border border-border-light bg-card p-6 text-center text-[14px] text-text-muted">
            {t("no_vendor_reviews_yet")}
          </div>
        )}
      </div>
    </section>
  );
}
