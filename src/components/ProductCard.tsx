"use client";

import { useState } from "react";
import Link from "next/link";
import AddToCartButton from "./AddToCartButton";
import { formatPrice } from "@/utils/currency";
import { useCurrencyStore } from "@/store/useCurrencyStore";

type ProductCardProps = {
  id: string;
  name: string;
  sku: string;
  priceEur?: number;
  priceRub?: number;
  description?: string;
  image?: string;
};

function CardImagePlaceholder() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-12 w-12 text-slate-400"
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
      <circle cx="13" cy="10" r="1.2" fill="currentColor" />
    </svg>
  );
}

export default function ProductCard({
  id,
  name,
  sku,
  priceEur,
  priceRub,
  description,
  image,
}: ProductCardProps) {
  const rate = useCurrencyStore((s) => s.rate);
  const [imageError, setImageError] = useState(false);
  const href = `/product/${id}`;
  const imageSrc = image?.trim() || undefined;
  const showImage = imageSrc && !imageError;

  const handleImageError = () => {
    console.error("Ошибка загрузки:", imageSrc);
    setImageError(true);
  };

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-md shadow-slate-200/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-300/50">
      <Link href={href} className="flex flex-1 flex-col" tabIndex={0}>
        <div className="flex aspect-[4/3] w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-3">
          <div className="flex h-full w-full items-center justify-center rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            {showImage ? (
              <img
                src={imageSrc}
                alt={name}
                className="h-full w-full object-contain"
                onError={handleImageError}
              />
            ) : (
              <CardImagePlaceholder />
            )}
          </div>
        </div>
      <div className="flex flex-1 flex-col gap-2 px-4 pb-4 pt-3">
        <h3 className="min-h-[2.5rem] line-clamp-2 text-sm font-bold text-slate-900 leading-tight hover:text-[#003366]">
          {name}
        </h3>
        <span className="text-[11px] font-medium text-slate-400">
          Артикул: {sku}
        </span>

        {description && (
          <p className="line-clamp-2 text-xs text-slate-500">{description}</p>
        )}

        <div className="mt-1 flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#fff4e6] px-2 py-0.5 font-medium text-[#ff8c00]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff8c00]" />
            В наличии
          </span>
          <span className="text-[11px] text-slate-400">Цена с НДС</span>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span className="text-base font-semibold text-slate-900">
            {formatPrice(priceEur, priceRub, rate)}
          </span>
        </div>
      </div>
      </Link>
      <div className="px-4 pb-4">
        <AddToCartButton
          id={id}
          name={name}
          priceEur={priceEur}
          priceRub={priceRub}
          variant="card"
        />
      </div>
    </article>
  );
}
