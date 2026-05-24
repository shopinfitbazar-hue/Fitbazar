"use client";

import { X } from "lucide-react";
import { getSafeImageUrl, FALLBACK_PRODUCT_IMAGE } from "@/lib/media";
import SmartImage from "@/components/ui/SmartImage";

type ImagePreviewStripProps = {
  images: string[];
  onRemove?: (imageUrl: string) => void;
  emptyText?: string;
};

export default function ImagePreviewStrip({
  images,
  onRemove,
  emptyText = "No images selected yet.",
}: ImagePreviewStripProps) {
  if (!images.length) {
    return <p className="text-[12px] text-text-muted">{emptyText}</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {images.map((imageUrl) => (
        <div key={imageUrl} className="rounded-[8px] border border-border-light bg-[var(--bg-surface)] p-2">
          <div className="relative aspect-[3/4] overflow-hidden rounded-[6px]">
            <SmartImage
              src={getSafeImageUrl(imageUrl, FALLBACK_PRODUCT_IMAGE)}
              alt="Preview"
              fill
              className="object-cover"
            />
          </div>
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
      ))}
    </div>
  );
}
