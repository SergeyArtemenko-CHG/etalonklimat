"use client";

import { useEffect, useRef } from "react";
import { useCurrencyStore } from "@/store/useCurrencyStore";

/** При монтировании запрашивает курс ЦБ и обновляет useCurrencyStore. Рендерит null. */
export default function CurrencyRateLoader() {
  const fetchRate = useCurrencyStore((s) => s.fetchRate);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchRate();
  }, [fetchRate]);

  return null;
}
