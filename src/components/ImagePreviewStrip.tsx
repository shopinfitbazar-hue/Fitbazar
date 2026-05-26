"use client";

import { Sparkles, Star, X } from "lucide-react";
import { getSafeImageUrl, getShowcaseImageUrl, FALLBACK_PRODUCT_IMAGE } from "@/lib/media";
import SmartImage from "@/components/ui/SmartImage";

type ImagePreviewStripProps = {
  images: string[];
  onRemove?: (imageUrl: string) => void;
  onMakeCover?: (imageUrl: string) => void;
  emptyText?: string;
  showShowcasePreview?: boolean;
};

export default function ImagePreviewStrip({
  images,
  onRemove,
  onMakeCover,
  emptyText = "No images selected yet.",
  showShowcasePreview = false,
}: ImagePreviewStripProps) {
  if (!images.length) {
    return <p className="text-[12px] text-text-muted">{emptyText}</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {images.map((imageUrl, index) => {
        const rawUrl = getSafeImageUrl(imageUrl, FALLBACK_PRODUCT_IMAGE);
        const displayUrl = showShowcasePreview ? getShowcaseImageUrl(rawUrl) : rawUrl;
        return (
        <div key={imageUrl} className="rounded-[8px] border border-border-light bg-[var(--bg-surface)] p-2">
          <div className="relative aspect-[3/4] overflow-hidden rounded-[6px] bg-[#f7f1ea]">
            <SmartImage
              src={displayUrl}
              alt="Preview"
              fill
              className="object-cover"
            />
            {index === 0 ? (
              <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-text-primary shadow-[var(--shadow-sm)]">
                <Sparkles className="h-3 w-3 text-fb-pink" />
                Cover
              </span>
            ) : null}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {onMakeCover && index !== 0 ? (
              <button
                type="button"
                onClick={() => onMakeCover(imageUrl)}
                className="inline-flex items-center gap-1 text-[12px] font-medium text-text-secondary hover:text-fb-pink"
              >
                <Star className="h-3.5 w-3.5" />
                Cover
              </button>
            ) : null}
            {onRemove ? (
            <button
              type="button"
              onClick={() => onRemove(imageUrl)}
              className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-fb-pink"
            >
              <X className="h-3.5 w-3.5" />
              Remove
            </button>
            ) : null}
          </div>
        </div>
        );
      })}
    </div>
  );
}
