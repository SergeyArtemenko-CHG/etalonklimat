"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";

const SHOW_DELAY_MS = 5000;
const MOBILE_AUTO_HIDE_MS = 5000;
const MOBILE_BREAKPOINT = 768;
const EXIT_ANIMATION_MS = 320;
const POPULAR_SECTION_ID = "popular-products";

function isCatalogPricePage(pathname: string): boolean {
  return (
    pathname.startsWith("/category/") ||
    pathname.startsWith("/product/") ||
    pathname.startsWith("/brands/")
  );
}

function isHomePage(pathname: string): boolean {
  return pathname === "/";
}

function isMobileViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < MOBILE_BREAKPOINT;
}

export default function AuthToast() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasShownRef = useRef(false);

  const hideToast = useCallback((animate = true) => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    if (!animate) {
      setExiting(false);
      setVisible(false);
      return;
    }

    setExiting(true);
    window.setTimeout(() => {
      setVisible(false);
      setExiting(false);
    }, EXIT_ANIMATION_MS);
  }, []);

  const dismiss = useCallback(() => {
    hideToast(true);
  }, [hideToast]);

  const revealToast = useCallback(() => {
    if (hasShownRef.current || session?.user) return;
    hasShownRef.current = true;

    setExiting(false);
    setVisible(true);

    if (isMobileViewport()) {
      hideTimerRef.current = window.setTimeout(() => {
        hideToast(true);
      }, MOBILE_AUTO_HIDE_MS);
    }
  }, [session?.user, hideToast]);

  useEffect(() => {
    hasShownRef.current = false;
  }, [pathname]);

  useEffect(() => {
    if (status === "loading") return;

    hideToast(false);

    if (session?.user) return;

    const isHome = isHomePage(pathname);
    const isCatalog = isCatalogPricePage(pathname);

    if (!isHome && !isCatalog) return;

    let showTimer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;
    let observer: IntersectionObserver | null = null;

    const scheduleShowAfterLoad = () => {
      if (cancelled) return;
      showTimer = window.setTimeout(() => {
        if (!cancelled) revealToast();
      }, SHOW_DELAY_MS);
    };

    if (isHome) {
      const attachObserver = () => {
        const section = document.getElementById(POPULAR_SECTION_ID);
        if (!section) return;

        observer = new IntersectionObserver(
          (entries) => {
            const entry = entries[0];
            if (entry?.isIntersecting && !cancelled) {
              revealToast();
              observer?.disconnect();
            }
          },
          { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
        );

        observer.observe(section);
      };

      if (document.readyState === "complete") {
        attachObserver();
      } else {
        window.addEventListener("load", attachObserver, { once: true });
      }
    } else {
      if (document.readyState === "complete") {
        scheduleShowAfterLoad();
      } else {
        window.addEventListener("load", scheduleShowAfterLoad, { once: true });
      }
    }

    return () => {
      cancelled = true;
      if (showTimer) clearTimeout(showTimer);
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      observer?.disconnect();
    };
  }, [pathname, session?.user, status, hideToast, revealToast]);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-5 left-0 z-[10040] flex justify-start pl-3 md:bottom-6 md:pl-4"
      aria-live="polite"
    >
      <div
        role="status"
        className={`pointer-events-auto relative flex w-[14.5rem] flex-col items-center overflow-visible rounded-none border border-text-muted/20 bg-card-bg px-3.5 pb-3.5 pt-3 shadow-lg shadow-text-muted/15 sm:w-[16rem] ${
          exiting
            ? "animate-[authToastSlideOut_0.32s_ease-in_forwards]"
            : "animate-[authToastSlideIn_0.35s_ease-out]"
        }`}
      >
        <button
          type="button"
          onClick={dismiss}
          className="absolute -right-3 -top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-text-muted/25 bg-white text-[#475659] shadow-lg shadow-black/20 transition hover:border-text-muted/40 hover:bg-slate-50 hover:text-text-main"
          aria-label="Закрыть уведомление"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            aria-hidden
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <span className="relative mb-2.5 mt-1 inline-flex shrink-0" aria-hidden>
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-[18px] w-[18px]"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </span>
          <span className="absolute -bottom-px -right-px flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-card-bg bg-accent px-0.5 text-[9px] font-extrabold leading-none text-white">
            %
          </span>
        </span>

        <p className="mb-3 w-full text-center text-sm font-medium leading-snug text-text-main">
          Для авторизованных покупателей доступны{" "}
          <span className="relative inline-block">
            <span className="relative z-10 font-extrabold text-accent">
              скидки до 50%
            </span>
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 overflow-hidden rounded-sm"
            >
              <span className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-transparent via-accent/30 to-transparent opacity-80 animate-[shimmer_5s_linear_infinite]" />
            </span>
          </span>{" "}
          от цен на сайте, актуальные цены и сроки поставки на товар под заказ
        </p>

        <Link
          href="/login"
          className="flex h-11 w-full items-center justify-center rounded-none bg-[#ff0000] px-3 text-sm font-medium text-white shadow-lg transition hover:bg-[#e60000]"
        >
          Авторизоваться
        </Link>
      </div>
    </div>
  );
}
