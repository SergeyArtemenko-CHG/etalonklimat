"use client";

import { useState } from "react";
import type { ProductSpec, ProductFile } from "@/data/products";

const TABS = [
  { id: "description", label: "Описание" },
  { id: "specs", label: "Технические характеристики" },
  { id: "files", label: "Документация и файлы" },
] as const;

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
  const [active, setActive] =
    useState<(typeof TABS)[number]["id"]>("description");

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex border-b border-slate-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            className={`flex-1 px-4 py-3 text-sm font-medium transition md:px-6 ${
              active === tab.id
                ? "border-b-2 border-[#ff8c00] text-[#ff8c00]"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4 md:p-6">
        {active === "description" && (
          <div className="prose prose-sm max-w-none text-slate-600">
            <p>{longDescription || description || "Описание отсутствует."}</p>
          </div>
        )}

        {active === "specs" && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[300px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-left font-semibold text-slate-700">
                    Название свойства
                  </th>
                  <th className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-left font-semibold text-slate-700">
                    Значение
                  </th>
                </tr>
              </thead>
              <tbody>
                {specs.length > 0 ? (
                  specs.map((spec, i) => (
                    <tr
                      key={i}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
                    >
                      <td className="px-4 py-3 text-slate-600">{spec.name}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {spec.value}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="px-4 py-6 text-center text-slate-500">
                      Технические характеристики не указаны.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {active === "files" && (
          <ul className="space-y-2">
            {files.length > 0 ? (
              files.map((file, i) => (
                <li key={i}>
                  <a
                    href={file.url}
                    className="inline-flex items-center gap-2 text-sm text-[#003366] underline hover:text-[#ff8c00]"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    {file.name}
                  </a>
                </li>
              ))
            ) : (
              <li className="text-slate-500">
                Документация и файлы не загружены.
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
