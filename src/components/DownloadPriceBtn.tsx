"use client";

import { useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { products } from "@/data/products";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import type { Product } from "@/data/products";

const FONT_URL = "/fonts/Roboto-Regular.ttf";
const FONT_CDN = "https://cdn.jsdelivr.net/gh/googlefonts/roboto@main/src/hinted/Roboto-Regular.ttf";

async function loadFont(doc: jsPDF): Promise<boolean> {
  for (const url of [FONT_URL, FONT_CDN]) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const arrayBuffer = await res.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
      doc.addFileToVFS("Roboto-Regular.ttf", base64);
      doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
      doc.setFont("Roboto", "normal");
      return true;
    } catch {
      continue;
    }
  }
  return false;
}

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
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const fontLoaded = await loadFont(doc);
      if (!fontLoaded) {
        setError("Не удалось загрузить шрифт (Cyrillic). Добавьте public/fonts/Roboto-Regular.ttf");
        return;
      }

      const dateStr = new Date().toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      doc.setFontSize(18);
      doc.text("Прайс-лист ETALON", 14, 20);
      doc.setFontSize(10);
      doc.text(`Дата: ${dateStr}`, 14, 28);
      doc.text(`Курс EUR: ${rate} руб.`, 14, 34);

      const tableData = products
        .map((p) => {
          const priceRub = getPriceRub(p, rate);
          if (priceRub == null) return null;
          return [p.category, p.sku, p.name, new Intl.NumberFormat("ru-RU").format(priceRub)];
        })
        .filter((r): r is [string, string, string, string] => r != null);

      autoTable(doc, {
        head: [["Категория", "Артикул", "Наименование", "Цена (руб.)"]],
        body: tableData,
        startY: 42,
        styles: { font: "Roboto", fontSize: 9 },
        headStyles: { fillColor: [0, 51, 102], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 246, 251] },
        margin: { left: 14, right: 14 },
      });

      doc.save(`price-list-etalon-${dateStr.replace(/\./g, "-")}.pdf`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка генерации PDF");
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
