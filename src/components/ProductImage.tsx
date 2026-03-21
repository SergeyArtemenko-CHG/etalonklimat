"use client";

import { useState } from "react";
import Image from "next/image";

const NO_IMAGE_PLACEHOLDER = "/images/products/no-image.webp";
const IMG_WIDTH = 800;
const IMG_HEIGHT = 600;

type ProductImageProps = {
  src: string | undefined;
  alt: string;
  className?: string;
  fallbackToPlaceholder?: boolean;
  /** LCP: приоритетная загрузка главного изображения (по умолчанию true для страницы товара) */
  priority?: boolean;
};

function PlaceholderSvg({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className ?? "h-16 w-16 text-slate-400"}
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
  priority = true,
}: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  const [placeholderFailed, setPlaceholderFailed] = useState(false);
  const rawSrc = src?.trim();
  const usePlaceholder =
    !rawSrc ||
    rawSrc.endsWith("no-image.webp") ||
    (fallbackToPlaceholder && failed);
  const imageSrc = usePlaceholder ? NO_IMAGE_PLACEHOLDER : rawSrc!;

  const handleError = () => {
    if (imageSrc === NO_IMAGE_PLACEHOLDER) {
      setPlaceholderFailed(true);
      return;
    }
    console.error("Ошибка загрузки:", imageSrc);
    if (fallbackToPlaceholder) setFailed(true);
  };

  if (usePlaceholder && placeholderFailed) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-100 ${className ?? ""}`}
        style={{ width: IMG_WIDTH, height: IMG_HEIGHT, maxWidth: "100%" }}
      >
        <PlaceholderSvg className="h-16 w-16 text-slate-400" />
      </div>
    );
  }

  return (
    <Image
      src={imageSrc}
      alt={alt}
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
