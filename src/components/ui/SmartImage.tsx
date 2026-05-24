"use client";

import Image, { type ImageProps } from "next/image";
import { type SyntheticEvent, useEffect, useMemo, useRef, useState } from "react";
import { buildImageSizes, getOptimizedImageUrl, getSafeImageUrl } from "@/lib/media";

type SmartImageProps = Omit<ImageProps, "src"> & {
  src: string | null | undefined;
  fallbackSrc?: string;
  aspectClassName?: string;
};

const FALLBACK_PLACEHOLDER =
  "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&auto=format&fit=crop&q=60";

const DEBUG = true;

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
  const imgRef = useRef<HTMLImageElement>(null);
  const initialSrc = useMemo(
    () => getOptimizedImageUrl(getSafeImageUrl(src, fallbackSrc)),
    [fallbackSrc, src],
  );
  const fallback = useMemo(() => getOptimizedImageUrl(fallbackSrc), [fallbackSrc]);
  const [currentSrc, setCurrentSrc] = useState(initialSrc);

  if (DEBUG) {
    console.log("[SmartImage] src:", src?.substring(0, 60), "resolved:", currentSrc.substring(0, 60));
  }

  useEffect(() => {
    setCurrentSrc(initialSrc);
    setLoaded(false);
    setErrored(false);
  }, [initialSrc]);

  useEffect(() => {
    if (!currentSrc) return;
    let cancelled = false;

    const onResolve = () => {
      if (cancelled) return;
      if (DEBUG) console.log("[SmartImage] preloader resolved:", currentSrc.substring(0, 60));
      setLoaded(true);
    };

    const preloader = new window.Image();
    preloader.addEventListener("load", onResolve, { once: true });
    preloader.addEventListener("error", onResolve, { once: true });
    preloader.src = currentSrc;

    if (preloader.complete) {
      onResolve();
    }

    return () => {
      cancelled = true;
    };
  }, [currentSrc]);

  const handleError = () => {
    if (DEBUG) console.log("[SmartImage] error for:", currentSrc.substring(0, 60));
    if (!errored) {
      setErrored(true);
      setCurrentSrc(fallback);
    }
  };

  const handleLoad = (event: SyntheticEvent<HTMLImageElement, Event>) => {
    if (DEBUG) console.log("[SmartImage] onLoad:", currentSrc.substring(0, 60));
    setLoaded(true);
    onLoad?.(event);
  };

  return (
    <div className={`relative overflow-hidden ${aspectClassName ?? ""}`}>
      <div
        className={`pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(246,240,235,0.95),rgba(255,255,255,0.55))] transition-opacity duration-300 ${loaded ? "opacity-0" : "opacity-100"}`}
      />
      <Image
        ref={imgRef}
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
