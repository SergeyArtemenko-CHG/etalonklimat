"use client";

import { preload } from "react-dom";

type Props = {
  href: string;
};

/** Предзагрузка основного фото товара в head — устраняет NO_LCP */
export default function PreloadProductImage({ href }: Props) {
  if (!href?.trim()) return null;

  preload(href, {
    as: "image",
    fetchPriority: "high",
  });

  return null;
}
