"use client";

import Link from "next/link";
import { PUMPS_FLAT_MENU_LINKS } from "@/lib/pumps-nav";

type Props = {
  onNavigate?: () => void;
};

/**
 * Плоские ссылки насосов Vandjord — в той же сетке и стиле, что остальные категории.
 * Без вложенных списков и скроллбаров.
 */
export default function PumpsCatalogMenu({ onNavigate }: Props) {
  return (
    <>
      {PUMPS_FLAT_MENU_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          onClick={onNavigate}
          className="catalog-category-link w-fit text-sm font-medium"
        >
          {link.label}
        </Link>
      ))}
    </>
  );
}
