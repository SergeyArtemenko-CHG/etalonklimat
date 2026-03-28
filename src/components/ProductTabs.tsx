"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ProductSpec, ProductFile } from "@/data/products";

const TABS = [
  {
    id: "description",
    label: "Описание",
    labelMobile: "Описание",
  },
  {
    id: "specs",
    label: "Технические характеристики",
    labelMobile: "Характеристики",
  },
  {
    id: "files",
    label: "Документация и файлы",
    labelMobile: "Файлы",
  },
] as const;

function sectionDomId(tabId: (typeof TABS)[number]["id"]) {
  return `product-section-${tabId}`;
}

/** Локальные пути из каталога (/docs/...) → ссылка с корректной кодировкой (кириллица в имени файла). */
function fileDownloadHref(rawUrl: string): string {
  const path =
    rawUrl.startsWith("/docs/") && !rawUrl.startsWith("/docs-watermarked/")
      ? rawUrl.replace("/docs/", "/docs-watermarked/")
      : rawUrl;
  if (path.startsWith("/") || path.startsWith("./")) {
    return encodeURI(path);
  }
  return path;
}

type ProductTabsProps = {
  longDescription?: string;
  description?: string;
  specs?: ProductSpec[];
  files?: ProductFile[];
};

export default function ProductTabs({
  longDescription,
  description,
  specs = [],
  files = [],
}: ProductTabsProps) {
  const [active, setActive] = useState<(typeof TABS)[number]["id"]>("description");
  const skipObserver = useRef(false);

  const scrollToSection = useCallback((tabId: (typeof TABS)[number]["id"]) => {
    const el = document.getElementById(sectionDomId(tabId));
    if (!el) return;
    skipObserver.current = true;
    setActive(tabId);
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    const url = new URL(window.location.href);
    url.hash = sectionDomId(tabId);
    window.history.replaceState(null, "", url.toString());
    window.setTimeout(() => {
      skipObserver.current = false;
    }, 800);
  }, []);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    const match = TABS.find((t) => sectionDomId(t.id) === hash);
    if (match) {
      requestAnimationFrame(() => scrollToSection(match.id));
    }
  }, [scrollToSection]);

  useEffect(() => {
    const sectionEls = TABS.map((t) =>
      document.getElementById(sectionDomId(t.id))
    ).filter(Boolean) as HTMLElement[];

    if (sectionEls.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (skipObserver.current) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const first = visible[0];
        if (!first?.target?.id) return;
        const tab = TABS.find((t) => sectionDomId(t.id) === first.target.id);
        if (tab) setActive(tab.id);
      },
      {
        root: null,
        rootMargin: "-45% 0px -45% 0px",
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      }
    );

    sectionEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const descriptionBlock = (() => {
    const text = (longDescription || description || "").trim();
    if (!text) {
      return <p className="text-slate-600">Описание отсутствует.</p>;
    }
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length <= 1) {
      return <p className="text-slate-600">{lines[0]}</p>;
    }
    return (
      <ul className="list-disc space-y-1 pl-4 marker:text-[#FF8C00]">
        {lines.map((line, index) => (
          <li key={index} className="text-slate-600">
            {line}
          </li>
        ))}
      </ul>
    );
  })();

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <nav
        aria-label="Разделы карточки товара"
        className="sticky top-0 z-20 flex flex-nowrap overflow-x-auto border-b border-slate-200 bg-white/95 py-1 shadow-sm backdrop-blur-sm max-md:top-14 md:top-0"
      >
        {TABS.map((tab) => (
          <a
            key={tab.id}
            href={`#${sectionDomId(tab.id)}`}
            onClick={(e) => {
              e.preventDefault();
              scrollToSection(tab.id);
            }}
            className={`shrink-0 border-b-2 px-3 py-3 text-xs font-medium transition md:flex-1 md:px-6 md:text-center md:text-sm ${
              active === tab.id
                ? "border-[#ff8c00] text-[#ff8c00]"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <span className="md:hidden">{tab.labelMobile}</span>
            <span className="hidden md:inline">{tab.label}</span>
          </a>
        ))}
      </nav>

      <div className="divide-y divide-slate-200">
        <section
          id={sectionDomId("description")}
          className="scroll-mt-28 px-4 py-6 md:scroll-mt-32 md:px-6 md:py-8"
          aria-labelledby="product-heading-description"
        >
          <h2
            id="product-heading-description"
            className="mb-4 text-lg font-semibold text-[#0b1f33] md:text-xl"
          >
            Описание
          </h2>
          <div className="prose prose-sm max-w-none">{descriptionBlock}</div>
        </section>

        <section
          id={sectionDomId("specs")}
          className="scroll-mt-28 px-4 py-6 md:scroll-mt-32 md:px-6 md:py-8"
          aria-labelledby="product-heading-specs"
        >
          <h2
            id="product-heading-specs"
            className="mb-4 text-lg font-semibold text-[#0b1f33] md:text-xl"
          >
            Технические характеристики
          </h2>
          <div className="block w-full overflow-x-auto">
            <table className="w-full min-w-[320px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="whitespace-nowrap border-b border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-slate-700 md:px-4 md:text-sm">
                    Название свойства
                  </th>
                  <th className="whitespace-nowrap border-b border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-slate-700 md:px-4 md:text-sm">
                    Значение
                  </th>
                </tr>
              </thead>
              <tbody>
                {specs.length > 0 ? (
                  specs.map((spec, i) => (
                    <tr
                      key={i}
                      className={`border-b border-slate-100 last:border-0 ${
                        i % 2 === 0 ? "bg-white" : "bg-slate-50/70"
                      } hover:bg-slate-100/60`}
                    >
                      <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-600 md:px-4 md:text-sm">
                        {spec.name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs font-medium text-slate-900 md:px-4 md:text-sm">
                        {spec.value}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-3 py-6 text-center text-xs text-slate-500 md:px-4 md:text-sm"
                    >
                      Технические характеристики не указаны.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section
          id={sectionDomId("files")}
          className="scroll-mt-28 px-4 py-6 md:scroll-mt-32 md:px-6 md:py-8"
          aria-labelledby="product-heading-files"
        >
          <h2
            id="product-heading-files"
            className="mb-4 text-lg font-semibold text-[#0b1f33] md:text-xl"
          >
            Документация и файлы
          </h2>
          <ul className="space-y-2">
            {files.length > 0 ? (
              files.map((file, i) => {
                const url = file.url ? fileDownloadHref(file.url) : "#";

                return (
                  <li key={i}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-[#003366] underline hover:text-[#ff8c00]"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      {file.name}
                    </a>
                  </li>
                );
              })
            ) : (
              <li className="text-slate-500">
                Документация и файлы не загружены.
              </li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
