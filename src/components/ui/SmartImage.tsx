"use client";

import Image, { type ImageProps } from "next/image";
import { type SyntheticEvent, useEffect, useMemo, useState } from "react";
import { buildImageSizes, getOptimizedImageUrl, getSafeImageUrl } from "@/lib/media";

type SmartImageProps = Omit<ImageProps, "src"> & {
  src: string | null | undefined;
  fallbackSrc?: string;
  aspectClassName?: string;
};

const FALLBACK_PLACEHOLDER =
  "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&auto=format&fit=crop&q=60";

export default function SmartImage({
  src,
  alt,
  fallbackSrc = FALLBACK_PLACEHOLDER,
  className,
  sizes,
  aspectClassName,
  fill,
  width,
  height,
  priority,
  onLoad,
  ...props
}: SmartImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const initialSrc = useMemo(
    () => getOptimizedImageUrl(getSafeImageUrl(src, fallbackSrc)),
    [fallbackSrc, src],
  );
  const fallback = useMemo(() => getOptimizedImageUrl(fallbackSrc), [fallbackSrc]);
  const [currentSrc, setCurrentSrc] = useState(initialSrc);

  useEffect(() => {
    setCurrentSrc(initialSrc);
    setLoaded(false);
    setErrored(false);
  }, [initialSrc]);

  const handleError = () => {
    if (!errored) {
      setErrored(true);
      setCurrentSrc(fallback);
    }
  };

  const handleLoad = (event: SyntheticEvent<HTMLImageElement, Event>) => {
    setLoaded(true);
    onLoad?.(event);
  };

  return (
    <div className={`relative overflow-hidden ${aspectClassName ?? ""}`}>
      <div
        className={`absolute inset-0 bg-[linear-gradient(135deg,rgba(246,240,235,0.95),rgba(255,255,255,0.55))] transition-opacity duration-300 ${loaded ? "opacity-0" : "opacity-100"}`}
      />
      <Image
        {...props}
        alt={alt}
        src={currentSrc}
        fill={fill}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        priority={priority}
        sizes={sizes || buildImageSizes()}
        className={className}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}
