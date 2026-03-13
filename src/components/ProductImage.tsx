"use client";

import { useState } from "react";

type ProductImageProps = {
  src: string | undefined;
  alt: string;
  className?: string;
  fallbackToPlaceholder?: boolean;
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
}: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  const baseSrc = src?.trim() || undefined;
  const imageSrc =
    baseSrc && !/\.[a-zA-Z0-9]+$/.test(baseSrc) ? `${baseSrc}.jpg` : baseSrc;
  const showImage = imageSrc && !failed;

  const handleError = () => {
    console.error("Ошибка загрузки:", imageSrc);
    if (fallbackToPlaceholder) {
      setFailed(true);
    }
  };

  if (showImage) {
    return (
      <img
        src={imageSrc}
        alt={alt}
        className={className}
        onError={handleError}
      />
    );
  }

  return (
    <div className="flex h-32 w-32 items-center justify-center rounded-xl border-2 border-dashed border-slate-400/60 bg-white/70">
      <PlaceholderSvg className="h-16 w-16 text-slate-400" />
    </div>
  );
}
