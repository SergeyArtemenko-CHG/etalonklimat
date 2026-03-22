"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type UseStickyGuardOptions = {
  /** Доля высоты вьюпорта, выше которой отключаем sticky (по умолчанию 0.4) */
  thresholdRatio?: number;
  /**
   * Если true (по умолчанию), правило по высоте применяется только на «компактных»
   * вьюпортах (мобильные, низкий экран, ландшафт на телефоне). На широких экранах
   * хедер остаётся sticky — условие срабатывает преимущественно там, где мало высоты.
   */
  applyGuardOnlyOnCompactViewport?: boolean;
  /** Ширина ниже которой считаем вьюпорт «мобильным» (px) */
  compactMaxWidth?: number;
  /** Высота ниже которой считаем вьюпорт «низким» (ландшафт, короткий экран) (px) */
  compactMaxHeight?: number;
};

function isCompactViewport(
  innerWidth: number,
  innerHeight: number,
  compactMaxWidth: number,
  compactMaxHeight: number
): boolean {
  if (innerWidth < compactMaxWidth) return true;
  if (innerHeight < compactMaxHeight) return true;
  // Ландшафт на смартфоне: ширина > высоты и мало места по вертикали
  const landscapePhone =
    innerWidth > innerHeight && innerHeight < compactMaxHeight + 80;
  return landscapePhone;
}

/**
 * Измеряет высоту элемента и сравнивает с window.innerHeight.
 * Если высота элемента / innerHeight > threshold — отключает sticky (isSticky = false).
 */
export function useStickyGuard(options: UseStickyGuardOptions = {}) {
  const {
    thresholdRatio = 0.4,
    applyGuardOnlyOnCompactViewport = true,
    compactMaxWidth = 768,
    compactMaxHeight = 700,
  } = options;

  const ref = useRef<HTMLElement | null>(null);
  const [isSticky, setIsSticky] = useState(true);
  const rafIdRef = useRef<number | null>(null);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el || typeof window === "undefined") return;

    const vh = window.innerHeight;
    if (vh <= 0) return;

    const h = el.getBoundingClientRect().height;
    const ratio = h / vh;

    if (applyGuardOnlyOnCompactViewport) {
      const compact = isCompactViewport(
        window.innerWidth,
        window.innerHeight,
        compactMaxWidth,
        compactMaxHeight
      );
      if (!compact) {
        setIsSticky(true);
        return;
      }
    }

    setIsSticky(ratio <= thresholdRatio);
  }, [
    applyGuardOnlyOnCompactViewport,
    compactMaxHeight,
    compactMaxWidth,
    thresholdRatio,
  ]);

  const scheduleMeasure = useCallback(() => {
    if (typeof window === "undefined") return;
    if (rafIdRef.current != null) {
      cancelAnimationFrame(rafIdRef.current);
    }
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      measure();
    });
  }, [measure]);

  useEffect(() => {
    // Первый замер после монтирования (ref уже привязан)
    scheduleMeasure();

    window.addEventListener("resize", scheduleMeasure, { passive: true });

    const el = ref.current;
    let ro: ResizeObserver | null = null;
    if (el && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => scheduleMeasure());
      ro.observe(el);
    }

    return () => {
      window.removeEventListener("resize", scheduleMeasure);
      ro?.disconnect();
      if (rafIdRef.current != null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [scheduleMeasure]);

  return { ref, isSticky };
}
