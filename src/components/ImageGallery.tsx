"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import SmartImage from "@/components/ui/SmartImage";
import { getSafeImageUrl, getShowcaseImageUrl, FALLBACK_GALLERY_IMAGE } from "@/lib/media";

interface ImageGalleryProps {
  images: string[];
  productName: string;
}

const defaultImages = [
  "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&auto=format&fit=crop",
];

export default function ImageGallery({ images, productName }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const displayImages = useMemo(
    () =>
      (images.length > 0 ? images : defaultImages).map((image) =>
        getShowcaseImageUrl(getSafeImageUrl(image, FALLBACK_GALLERY_IMAGE), { width: 1200, height: 1350 }),
      ),
    [images],
  );
  const imageCount = displayImages.length;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePosition({ x, y });
  };

  const goToPrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? imageCount - 1 : prev - 1));
  };

  const goToNext = () => {
    setSelectedIndex((prev) => (prev === imageCount - 1 ? 0 : prev + 1));
  };

  return (
    <div className="flex flex-col-reverse gap-3 lg:flex-row lg:gap-4">
      <div className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
        {displayImages.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedIndex(idx)}
            className={`relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-[8px] border transition-all sm:h-16 sm:w-16 lg:h-24 lg:w-24 ${
              selectedIndex === idx
                ? "border-fb-pink shadow-[0_10px_30px_rgba(16,24,39,0.1)]"
                : "border-transparent opacity-70 hover:opacity-100"
            }`}
          >
            <SmartImage src={img} alt={`${productName} - ${idx + 1}`} fill className="object-cover" sizes="96px" />
          </button>
        ))}
      </div>

      <div className="flex-1 relative">
        <div
          className="relative aspect-[4/3] cursor-zoom-in overflow-hidden rounded-[8px] border border-border-light bg-[linear-gradient(180deg,#f8f5f1,#f0ece6)] md:aspect-[16/10] lg:aspect-[1/1.05]"
          onMouseEnter={() => setIsZoomed(true)}
          onMouseLeave={() => setIsZoomed(false)}
          onMouseMove={handleMouseMove}
        >
          <SmartImage
            src={displayImages[selectedIndex]}
            alt={productName}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className={`object-cover transition-transform duration-300 ${
              isZoomed ? "scale-150" : ""
            }`}
            style={
              isZoomed
                ? {
                    transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
              }
                : undefined
            }
          />

          {displayImages.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-[rgba(255,255,255,0.88)] shadow-[var(--shadow-md)] backdrop-blur-md transition-colors hover:bg-white lg:left-4 lg:h-11 lg:w-11"
              >
                <ChevronLeft className="h-4 w-4 lg:h-5 lg:w-5" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-[rgba(255,255,255,0.88)] shadow-[var(--shadow-md)] backdrop-blur-md transition-colors hover:bg-white lg:right-4 lg:h-11 lg:w-11"
              >
                <ChevronRight className="h-4 w-4 lg:h-5 lg:w-5" />
              </button>
            </>
          )}

          <div className="absolute bottom-4 right-4 hidden items-center gap-2 rounded-full border border-white/70 bg-[rgba(255,255,255,0.88)] px-3 py-1.5 text-sm font-medium backdrop-blur-md lg:flex">
            <ZoomIn className="w-4 h-4" />
            Hover to zoom
          </div>
        </div>

        <div className="mt-3 flex justify-center gap-2 lg:hidden">
          {displayImages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedIndex(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                selectedIndex === idx ? "w-6 bg-fb-pink" : "bg-gray-300"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
