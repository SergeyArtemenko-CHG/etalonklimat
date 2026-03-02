"use client";

import { useEffect } from "react";
import { useCurrencyStore } from "@/store/useCurrencyStore";

/** При монтировании запрашивает курс ЦБ и обновляет useCurrencyStore. Рендерит null. */
export default function CurrencyRateLoader() {
  const fetchRate = useCurrencyStore((s) => s.fetchRate);

  useEffect(() => {
    fetchRate();
  }, [fetchRate]);

  return null;
}
