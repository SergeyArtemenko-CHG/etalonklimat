"use client";

import { useState } from "react";
import { products } from "@/data/products";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import type { Product } from "@/data/products";

function getPriceRub(p: Product, rate: number): number | null {
  if (p.priceRub != null && p.priceRub > 0) return p.priceRub;
  if (p.priceEur != null && p.priceEur > 0) return Math.round(p.priceEur * rate);
  return null;
}

export default function DownloadPriceBtn() {
  const rate = useCurrencyStore((s) => s.rate);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      const pdfMakeModule = await import("pdfmake/build/pdfmake");
      const pdfFonts: any = await import("pdfmake/build/vfs_fonts");
      const pdfMake: any = pdfMakeModule.default || pdfMakeModule;

      // Инициализация встроенного VFS и шрифтов Roboto из pdfmake
      pdfMake.vfs = pdfFonts.pdfMake?.vfs || pdfFonts.default?.pdfMake?.vfs || pdfFonts;
      pdfMake.fonts = {
        Roboto: {
          normal: "Roboto-Regular.ttf",
          bold: "Roboto-Medium.ttf",
        },
      };

      const dateStr = new Date().toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      const tableBody = products
        .filter((p) => p.inStock !== false)
        .map((p) => {
          const priceRub = getPriceRub(p, rate);
          if (priceRub == null) return null;
          return [
            p.category,
            p.sku,
            p.name,
            new Intl.NumberFormat("ru-RU").format(priceRub),
          ];
        })
        .filter((r): r is string[] => r != null);

      const docDefinition = {
        pageSize: "A4" as const,
        pageMargins: [40, 60, 40, 40],
        defaultStyle: { font: "Roboto", fontSize: 9 },
        content: [
          { text: "Прайс-лист ETALON", style: "header", margin: [0, 0, 0, 8] },
          { text: `Дата: ${dateStr}`, fontSize: 10, margin: [0, 0, 0, 4] },
          { text: `Курс EUR: ${rate} руб.`, fontSize: 10, margin: [0, 0, 0, 16] },
          {
            table: {
              headerRows: 1,
              widths: ["*", "auto", "*", "auto"],
              body: [
                [
                  { text: "Категория", style: "tableHeader" },
                  { text: "Артикул", style: "tableHeader" },
                  { text: "Наименование", style: "tableHeader" },
                  { text: "Цена (руб.)", style: "tableHeader" },
                ],
                ...tableBody,
              ],
            },
            layout: {
              fillColor: (rowIndex: number) =>
                rowIndex >= 1 && (rowIndex - 1) % 2 === 1 ? "#f5f6fb" : undefined,
            },
          },
        ],
        styles: {
          header: { fontSize: 18, bold: true },
          tableHeader: { fillColor: "#003366", color: "white", bold: true },
        },
      };

      const pdfDoc = pdfMake.createPdf(docDefinition);
      pdfDoc.download(`price-list-etalon-${dateStr.replace(/\./g, "-")}.pdf`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка генерации PDF");
      console.error("DownloadPriceBtn PDF error:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 space-y-2 border-t border-white/20 pt-4">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#FF8C00] bg-[#FF8C00] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#ff9f26] disabled:opacity-60"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
        {loading ? "Генерация…" : "Скачать прайс (PDF)"}
      </button>
      {error && <p className="text-xs text-red-300">{error}</p>}
    </div>
  );
}
