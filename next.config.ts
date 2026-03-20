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

  experimental: {
    // Отключаем PPR, чтобы не усложнять генерацию страниц в продакшене
    ppr: false,
    // Ограничиваем параллелизм сборки для серверов с 2 ГБ ОЗУ
    workerThreads: false,
    cpus: 1,
  },

  /* config options here */
  reactCompiler: true,
};

export default nextConfig;
