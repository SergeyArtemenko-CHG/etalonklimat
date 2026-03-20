"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import AddToCartButton from "./AddToCartButton";
import { formatPrice } from "@/utils/currency";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { useProductRequestStore } from "@/store/productRequest";

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
  partnerDiscount1?: number;
  partnerDiscount2?: number;
  partnerDiscount3?: number;
  leadTime?: string;
  imagePriority?: boolean;
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

export default function ProductCard(props: ProductCardProps) {
  const {
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
    partnerDiscount1,
    partnerDiscount2,
    partnerDiscount3,
    leadTime,
    imagePriority = false,
  } = props;

  const rate = useCurrencyStore((s) => s.rate);
  const [imageError, setImageError] = useState(false);
  const openRequestModal = useProductRequestStore((s) => s.open);
  const { data: session } = useSession();
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

  const trimmedDescription = description?.trim() || "";

  const rawStatus = (session?.user as any)?.status as number | undefined;
  const isAuthorized = Number.isFinite(rawStatus);
  const partnerGroup = isAuthorized
    ? ((rawStatus as 1 | 2 | 3) ?? undefined)
    : undefined;

  const hasRub = typeof priceRub === "number";
  const retailRub = hasRub
    ? priceRub!
    : priceEur != null && rate
    ? priceEur * rate
    : undefined;
  const retailRubRounded =
    retailRub != null && Number.isFinite(retailRub) ? Math.round(retailRub) : undefined;
  const hasRetailPrice = retailRub != null && retailRub > 0;

  let discountPercent: number | undefined;
  if (partnerGroup === 1) discountPercent = partnerDiscount1;
  if (partnerGroup === 2) discountPercent = partnerDiscount2;
  if (partnerGroup === 3) discountPercent = partnerDiscount3;

  const hasDiscount = hasRetailPrice && isAuthorized && discountPercent != null;
  const finalRub = hasDiscount
    ? Math.round(retailRubRounded! * (1 - discountPercent! / 100))
    : hasRetailPrice
    ? retailRubRounded!
    : undefined;

  const isPriceOnRequest = !hasRetailPrice && !!leadTime;

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
              <Image
                src={imageSrc!}
                alt={name}
                width={240}
                height={180}
                sizes="(max-width: 768px) 80px, 240px"
                className="h-20 w-20 object-contain md:h-32 md:w-full"
                onError={handleImageError}
                priority={imagePriority}
              />
            ) : (
              <CardImagePlaceholder />
            )}
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 md:px-4 md:pb-4 md:pt-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                inStock
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  inStock ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              {inStock ? "В наличии" : "Под заказ"}
            </span>
          </div>
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
          {trimmedDescription && (
            <p className="line-clamp-2 text-[11px] text-slate-500">
              {trimmedDescription}
            </p>
          )}
          {!inStock && !isAuthorized ? (
            <div className="mt-1 space-y-0.5">
              <span className="text-sm font-medium text-slate-700">
                Цена по запросу
              </span>
              <p className="text-[11px] text-slate-500">
                Срок поставки:{" "}
                <span className="font-medium">Уточняйте у менеджера</span>
              </p>
            </div>
          ) : (isAuthorized || inStock) ? (
            <div className="mt-1 space-y-0.5">
              {isPriceOnRequest ? (
                <span className="text-sm font-medium text-slate-700">
                  Цена по запросу
                </span>
              ) : finalRub != null ? (
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-base font-semibold text-slate-900">
                    {finalRub.toLocaleString("ru-RU")} ₽
                  </span>
                  {hasDiscount && retailRub != null && (
                    <>
                      <span className="text-[11px] text-slate-400 line-through">
                        {(retailRubRounded ?? retailRub).toLocaleString("ru-RU")} ₽
                      </span>
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        -{discountPercent}% <span className="ml-1">Ваша цена</span>
                      </span>
                    </>
                  )}
                </div>
              ) : (
                <span className="text-sm text-slate-500">
                  {formatPrice(priceEur, priceRub, rate)}
                </span>
              )}
              {isAuthorized ? (
                leadTime && (
                  <p
                    className={`text-[11px] ${
                      !inStock ? "text-blue-600" : "text-slate-500"
                    }`}
                  >
                    Срок поставки:{" "}
                    <span className="font-medium">{leadTime}</span>
                  </p>
                )
              ) : (
                !inStock && (
                  <p className="text-[11px] text-slate-500">
                    Срок поставки:{" "}
                    <span className="font-medium">Уточняйте у менеджера</span>
                  </p>
                )
              )}
            </div>
          ) : null}
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
          <>
            {!isAuthorized || !leadTime ? (
              <button
                type="button"
                onClick={() =>
                  openRequestModal({
                    type: "price",
                    productName: name,
                    productId: id,
                    productSku: sku,
                  })
                }
                className="w-full rounded-lg bg-[#FF8C00] px-2 py-1.5 text-[11px] font-semibold text-white shadow-md transition hover:bg-[#ff9f26] md:py-2"
              >
                Запросить
              </button>
            ) : (
              <div className="h-[30px] md:h-[36px]" aria-hidden />
            )}
          </>
        )}
      </div>
    </article>
  );
}
