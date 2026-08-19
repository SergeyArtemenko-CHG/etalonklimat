import type { NextConfig } from "next";

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
