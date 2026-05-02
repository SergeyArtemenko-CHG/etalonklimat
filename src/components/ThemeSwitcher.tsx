"use client";

import { useCallback, useEffect, useState } from "react";
import {
  SITE_THEME_STORAGE_KEY,
  type SiteThemeClass,
} from "@/lib/site-theme";

export { SITE_THEME_STORAGE_KEY, type SiteThemeClass } from "@/lib/site-theme";

export function applySiteThemeClass(theme: SiteThemeClass) {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  html.classList.remove("theme-1", "theme-2");
  html.classList.add(theme);
}

type ThemeSwitcherProps = {
  /** Цвет зазора focus-ring (под фон родителя: полоса хедера = primary-hover) */
  ringOffsetClassName?: string;
};

export default function ThemeSwitcher({
  ringOffsetClassName = "ring-offset-primary",
}: ThemeSwitcherProps) {
  const [active, setActive] = useState<SiteThemeClass>("theme-1");

  useEffect(() => {
    const html = document.documentElement;
    setActive(html.classList.contains("theme-2") ? "theme-2" : "theme-1");
  }, []);

  const select = useCallback((theme: SiteThemeClass) => {
    applySiteThemeClass(theme);
    try {
      localStorage.setItem(SITE_THEME_STORAGE_KEY, theme);
    } catch {
      /* ignore quota / private mode */
    }
    setActive(theme);
  }, []);

  const dotClass = `h-[14px] w-[14px] shrink-0 rounded-full border border-white/70 shadow-sm outline-none ring-offset-2 transition focus-visible:ring-2 focus-visible:ring-white ${ringOffsetClassName}`;

  return (
    <div
      className="pointer-events-auto flex shrink-0 items-center gap-2"
      role="group"
      aria-label="Тема оформления сайта"
    >
      <button
        type="button"
        aria-label="Вариант 1 — основная серая тема"
        aria-pressed={active === "theme-1"}
        onClick={() => select("theme-1")}
        className={`${dotClass} ${
          active === "theme-1" ? "ring-2 ring-white" : "opacity-90 hover:opacity-100"
        }`}
        style={{ backgroundColor: "#2C3545" }}
      />
      <button
        type="button"
        aria-label="Вариант 2 — дополнительная синяя тема"
        aria-pressed={active === "theme-2"}
        onClick={() => select("theme-2")}
        className={`${dotClass} ${
          active === "theme-2" ? "ring-2 ring-white" : "opacity-90 hover:opacity-100"
        }`}
        style={{ backgroundColor: "#003366" }}
      />
    </div>
  );
}
