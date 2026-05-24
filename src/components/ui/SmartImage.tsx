"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useMemo, useState } from "react";
import { buildImageSizes, getOptimizedImageUrl, getSafeImageUrl, isCloudinaryUrl } from "@/lib/media";

type SmartImageProps = Omit<ImageProps, "src"> & {
  src: string | null | undefined;
  fallbackSrc?: string;
  aspectClassName?: string;
};

export default function SmartImage({
  src,
  alt,
  fallbackSrc = "https://picsum.photos/seed/fitbazzar-image-fallback/1200/1600",
  className,
  sizes,
  aspectClassName,
  ...props
}: SmartImageProps) {
  const [loaded, setLoaded] = useState(false);
  const initialSrc = useMemo(
    () => getOptimizedImageUrl(getSafeImageUrl(src, fallbackSrc)),
    [fallbackSrc, src],
  );
  const fallback = useMemo(() => getOptimizedImageUrl(fallbackSrc), [fallbackSrc]);
  const [currentSrc, setCurrentSrc] = useState(initialSrc);

  useEffect(() => {
    setCurrentSrc(initialSrc);
    setLoaded(false);
  }, [initialSrc]);

  const useNativeImageDelivery = !isCloudinaryUrl(currentSrc);

  return (
    <div className={`relative overflow-hidden ${aspectClassName ?? ""}`}>
      <div className={`absolute inset-0 bg-[linear-gradient(135deg,rgba(246,240,235,0.95),rgba(255,255,255,0.55))] transition-opacity duration-300 ${loaded ? "opacity-0" : "opacity-100"}`} />
      <Image
        {...props}
        alt={alt}
        src={currentSrc}
        sizes={sizes || buildImageSizes()}
        className={className}
        unoptimized={useNativeImageDelivery}
        onLoad={(event) => {
          setLoaded(true);
          props.onLoad?.(event);
        }}
        onError={() => {
          if (currentSrc !== fallback) {
            setCurrentSrc(fallback);
            return;
          }
          setLoaded(true);
        }}
      />
    </div>
  );
}
