import type { NextConfig } from "next";

/** Старые подкатегории насосов → конфигуратор (дублирует LEGACY_PUMP_CATEGORY_SLUGS). */
const LEGACY_PUMP_CATEGORY_REDIRECTS = [
  "avtomaticheskaya-pogruzhnaya-kolodeznaya-nasosnaya-ustanovka",
  "vertikalnye-mnogostupenchatye-nasosy",
  "vertikalnye-mnogostupenchatye-nasosy-iz-nerzhaveyushchei-stali-aisi-316",
  "gorizontalnye-mnogostupenchatye-nasosy",
  "drenazhnye-nasosy-iz-nerzhaveyushchei-stali",
  "kommercheskie-ustanovki-povysheniya-davleniya",
  "kommercheskie-ustanovki-pozharotusheniya",
  "konsolno-monoblochnye-nasosy",
  "konsolno-monoblochnye-nasosy-iz-nerzhaveyushchei-stali",
  "konsolnye-nasosy",
  "odnostupenchatye-nasosy-in-lain",
  "samovsasyvayushchaya-nasosnaya-ustanovka",
] as const;

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true, // Пропускать ошибки типов при сборке
  },
  // Таймаут генерации статических страниц (мс)
  staticPageGenerationTimeout: 1000,
  images: {
    // Снижаем нагрузку на сборку/рантайм оптимизатора изображений
    unoptimized: true,
  },
  // ЧПУ без завершающего слэша — canonical должен совпадать
  trailingSlash: false,

  experimental: {
    // Отключаем PPR, чтобы не усложнять генерацию страниц в продакшене
    ppr: false,
  },

  /**
   * 301: старые подкатегории насосов → конфигуратор Vandjord.
   * Остальные категории не трогаем.
   */
  async redirects() {
    return LEGACY_PUMP_CATEGORY_REDIRECTS.map((slug) => ({
      source: `/category/${slug}`,
      destination: "/catalog/podbor-nasosov-vandjord",
      permanent: true,
    }));
  },

  /**
   * Опционально: отдать /api/chat-replies микросервису check_api.js (pm2 :3001).
   * В .env: CHAT_REPLIES_UPSTREAM=http://127.0.0.1:3001
   * Без переменной отвечает встроенный Route Handler Next.js.
   */
  async rewrites() {
    const upstream = (process.env.CHAT_REPLIES_UPSTREAM || "").trim().replace(/\/$/, "");
    if (!upstream) return [];
    return [
      {
        source: "/api/chat-replies",
        destination: `${upstream}/api/chat-replies`,
      },
    ];
  },
};

export default nextConfig;
