"use client";

import { useSession } from "next-auth/react";

type RetailPriceLabelProps = {
  className?: string;
  /** Не показывать, например при «Цена по запросу» */
  show?: boolean;
};

/** Подпись к розничной цене для гостей (без партнёрской скидки). */
export default function RetailPriceLabel({
  className = "",
  show = true,
}: RetailPriceLabelProps) {
  const { data: session } = useSession();
  const rawStatus = (session?.user as { status?: number } | undefined)?.status;
  const isAuthorized = Number.isFinite(rawStatus);

  if (!show || isAuthorized) return null;

  return (
    <span
      className={`whitespace-nowrap text-[10px] font-medium leading-none text-text-muted md:text-xs ${className}`}
    >
      Цена без скидки
    </span>
  );
}
