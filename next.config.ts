import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true, // Пропускать ошибки типов при сборке
  },

  experimental: {
    // Отключаем PPR, чтобы не усложнять генерацию страниц в продакшене
    ppr: false,
    // Ограничиваем время генерации одной статической страницы (мс),
    // чтобы билдер не "зависал" на тяжёлых страницах
    staticPageGenerationTimeout: 1000,
  },

  /* config options here */
  reactCompiler: true,
};

export default nextConfig;
