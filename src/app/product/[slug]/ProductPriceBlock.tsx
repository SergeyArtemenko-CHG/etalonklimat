"use client";

import { useSession } from "next-auth/react";
import { useCurrencyStore } from "@/store/useCurrencyStore";
type Props = {
  priceEur?: number;
  priceRub?: number;
  partnerDiscount1?: number;
  partnerDiscount2?: number;
  partnerDiscount3?: number;
  leadTime?: string;
  inStock?: boolean;
};

export default function ProductPriceBlock({
  priceEur,
  priceRub,
  partnerDiscount1,
  partnerDiscount2,
  partnerDiscount3,
  leadTime,
  inStock = true,
}: Props) {
  const { data: session } = useSession();
  const rate = useCurrencyStore((s) => s.rate);

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
  const showPrice = inStock || isAuthorized;

  return (
    <div className="mb-5 space-y-1">
      {!showPrice ? (
        <p className="text-lg font-semibold text-text-main">Цена по запросу</p>
      ) : isPriceOnRequest ? (
        <p className="text-lg font-semibold text-text-main">Цена по запросу</p>
      ) : finalRub != null ? (
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="text-3xl font-semibold tracking-tight text-text-main md:text-4xl">
            {finalRub.toLocaleString("ru-RU")} ₽
          </p>
          {hasDiscount && retailRub != null && (
            <>
              <span className="text-sm text-text-muted line-through">
                {(retailRubRounded ?? retailRub).toLocaleString("ru-RU")} ₽
              </span>
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                -{discountPercent}% <span className="ml-1 text-[10px]">Ваша цена</span>
              </span>
            </>
          )}
        </div>
      ) : (
        <p className="text-base text-text-muted">Цена по запросу</p>
      )}

      <span className="block text-xs uppercase tracking-[0.16em] text-text-muted">
        {!isAuthorized && showPrice && !isPriceOnRequest && finalRub != null
          ? "Цена без скидки с НДС"
          : "Цена с НДС"}
      </span>

      {isAuthorized ? (
        leadTime && (
          <p
            className={`text-sm ${
              !inStock ? "text-blue-600" : "text-text-muted"
            }`}
          >
            Срок поставки: <span className="font-medium">{leadTime}</span>
          </p>
        )
      ) : (
        <p className="text-sm text-text-muted">
          Срок поставки:{" "}
          <span className="font-medium">Уточняйте у менеджера</span>
        </p>
      )}
    </div>
  );
}
