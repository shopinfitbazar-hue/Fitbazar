"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import SmartImage from "@/components/ui/SmartImage";
import { getSafeImageUrl } from "@/lib/media";

interface ImageGalleryProps {
  images: string[];
  productName: string;
}

const defaultImages = [
  "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&auto=format&fit=crop",
  "https://picsum.photos/seed/fitbazar-gallery-ethnic/800/1066",
  "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&auto=format&fit=crop",
];

export default function ImageGallery({ images, productName }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePosition({ x, y });
  };

  const goToPrevious = () => {
    setSelectedIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setSelectedIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const displayImages = useMemo(
    () =>
      (images.length > 0 ? images : defaultImages).map((image, index) =>
        getSafeImageUrl(image, `https://picsum.photos/seed/fitbazzar-gallery-${index + 1}/800/1066`),
      ),
    [images],
  );

  return (
    <div className="flex flex-col-reverse gap-4 lg:flex-row">
      <div className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
        {displayImages.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedIndex(idx)}
            className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-[20px] border transition-all lg:h-24 lg:w-24 ${
              selectedIndex === idx
                ? "border-fb-pink shadow-[0_10px_30px_rgba(255,63,108,0.16)]"
                : "border-transparent opacity-70 hover:opacity-100"
            }`}
          >
            <SmartImage src={img} alt={`${productName} - ${idx + 1}`} fill className="object-cover" sizes="96px" />
          </button>
        ))}
      </div>

      <div className="flex-1 relative">
        <div
          className="relative aspect-[4/5] cursor-zoom-in overflow-hidden rounded-[32px] border border-white/70 bg-[linear-gradient(180deg,#f8f5f1,#f0ece6)] lg:aspect-[1/1.05]"
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
                className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-[rgba(255,255,255,0.88)] shadow-[var(--shadow-md)] backdrop-blur-md transition-colors hover:bg-white"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-[rgba(255,255,255,0.88)] shadow-[var(--shadow-md)] backdrop-blur-md transition-colors hover:bg-white"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full border border-white/70 bg-[rgba(255,255,255,0.88)] px-3 py-1.5 text-sm font-medium backdrop-blur-md">
            <ZoomIn className="w-4 h-4" />
            Hover to zoom
          </div>
        </div>

        <div className="mt-4 flex justify-center gap-2 lg:hidden">
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
