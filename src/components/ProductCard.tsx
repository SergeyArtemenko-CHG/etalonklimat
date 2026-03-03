"use client";

import { useState } from "react";
import Link from "next/link";
import AddToCartButton from "./AddToCartButton";
import ProductRequestForm from "./ProductRequestForm";
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
  burnerPowerMin?: number;
  burnerPowerMax?: number;
  inStock?: boolean;
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
  burnerPowerMin,
  burnerPowerMax,
  inStock = true,
}: ProductCardProps) {
  const rate = useCurrencyStore((s) => s.rate);
  const [imageError, setImageError] = useState(false);
  const [requestModal, setRequestModal] = useState(false);
  const href = `/product/${id}`;
  const imageSrc = image?.trim() || undefined;
  const showImage = imageSrc && !imageError;

  const handleImageError = () => {
    console.error("Ошибка загрузки:", imageSrc);
    setImageError(true);
  };

  const powerText = (() => {
    if (
      burnerPowerMin != null &&
      burnerPowerMax != null &&
      burnerPowerMin !== burnerPowerMax
    ) {
      return `${burnerPowerMin}–${burnerPowerMax} кВт`;
    }
    const single = burnerPowerMin ?? burnerPowerMax;
    if (single != null) {
      return `${single} кВт`;
    }
    return null;
  })();

  return (
    <article className="flex h-full flex-row overflow-hidden rounded-xl bg-white shadow-md shadow-slate-200/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-300/50 md:flex-col">
      <Link
        href={href}
        className="flex flex-1 items-center gap-2 px-2 py-2 md:flex-col md:items-stretch md:px-0 md:py-0"
        tabIndex={0}
      >
        <div className="flex shrink-0 items-center justify-center p-2 md:w-full md:p-3">
          <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5 shadow-sm md:p-3">
            {showImage ? (
              <img
                src={imageSrc}
                alt={name}
                className="h-20 w-20 object-contain md:h-32 md:w-full"
                onError={handleImageError}
              />
            ) : (
              <CardImagePlaceholder />
            )}
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 md:px-4 md:pb-4 md:pt-3">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900 hover:text-[#003366]">
            {name}
          </h3>
          <span className="text-[11px] font-medium text-slate-400">
            Артикул: {sku}
          </span>
          {powerText && (
            <span className="text-[11px] text-slate-500">
              Мощность: {powerText}
            </span>
          )}
          {inStock && (
            <span className="mt-1 text-base font-semibold text-slate-900">
              {formatPrice(priceEur, priceRub, rate)}
            </span>
          )}
        </div>
      </Link>
      <div className="px-2 pb-2 md:px-4 md:pb-4 md:pt-0">
        {inStock ? (
          <AddToCartButton
            id={id}
            name={name}
            priceEur={priceEur}
            priceRub={priceRub}
            variant="card"
          />
        ) : (
          <button
            type="button"
            onClick={() => setRequestModal(true)}
            className="w-full rounded-lg bg-[#FF8C00] px-2 py-1.5 text-[11px] font-semibold text-white shadow-md transition hover:bg-[#ff9f26] md:py-2"
          >
            Запросить
          </button>
        )}
      </div>
      {requestModal && (
        <ProductRequestForm
          type="price"
          productName={name}
          productId={id}
          productSku={sku}
          onClose={() => setRequestModal(false)}
        />
      )}
    </article>
  );
}
