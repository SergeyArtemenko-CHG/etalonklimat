"use client";

import { useCurrencyStore } from "@/store/useCurrencyStore";
import { formatPrice } from "@/utils/currency";

type Props = {
  priceEur?: number;
  priceRub?: number;
  className?: string;
};

/** Отображает цену в рублях по актуальному курсу из useCurrencyStore. */
export default function ProductPriceDisplay({
  priceEur,
  priceRub,
  className,
}: Props) {
  const rate = useCurrencyStore((s) => s.rate);
  return <span className={className}>{formatPrice(priceEur, priceRub, rate)}</span>;
}
