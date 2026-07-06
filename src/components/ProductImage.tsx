"use client";

import { useState } from "react";
import Image from "next/image";
import {
  getProductPlaceholderImageUrl,
  productImageAlt,
  resolveProductImageSrc,
} from "@/lib/product-url";

const IMG_WIDTH = 800;
const IMG_HEIGHT = 600;

type ProductImageProps = {
  src: string | undefined;
  alt: string;
  className?: string;
  fallbackToPlaceholder?: boolean;
  /** SKU или id — уникальный ?prod= для заглушки */
  productKey?: string;
  /** LCP: приоритетная загрузка главного изображения */
  priority?: boolean;
};

function PlaceholderSvg({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className ?? "h-16 w-16 text-text-muted"}
    >
      <rect
        x="3"
        y="6"
        width="18"
        height="11"
        rx="2"
        className="fill-none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M3 14h18"
        className="fill-none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="9" cy="10" r="1.2" fill="currentColor" />
      <circle cx="15" cy="10" r="1.2" fill="currentColor" />
    </svg>
  );
}

export default function ProductImage({
  src,
  alt,
  className,
  fallbackToPlaceholder = true,
  productKey = "item",
  priority = true,
}: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  const [placeholderFailed, setPlaceholderFailed] = useState(false);
  const rawSrc = src?.trim();
  const usePlaceholder =
    !rawSrc ||
    rawSrc.endsWith("no-image.webp") ||
    (fallbackToPlaceholder && failed);

  const imageSrc = resolveProductImageSrc(src, productKey, usePlaceholder);
  const imageAlt = productImageAlt(alt);

  const handleError = () => {
    if (imageSrc.includes("no-image.webp")) {
      setPlaceholderFailed(true);
      return;
    }
    if (fallbackToPlaceholder) setFailed(true);
  };

  if (usePlaceholder && placeholderFailed) {
    return (
      <div
        className={`flex min-h-0 min-w-0 items-center justify-center bg-main-bg ${className ?? ""}`}
        style={{ aspectRatio: `${IMG_WIDTH}/${IMG_HEIGHT}`, width: "100%" }}
      >
        <PlaceholderSvg className="h-16 w-16 shrink-0 text-text-muted" />
      </div>
    );
  }

  return (
    <Image
      src={imageSrc}
      alt={imageAlt}
      width={IMG_WIDTH}
      height={IMG_HEIGHT}
      sizes="(max-width: 768px) 100vw, 50vw"
      className={className}
      onError={handleError}
      priority={priority}
      fetchPriority="high"
    />
  );
}
