import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true, // Пропускать ошибки типов при сборке
  },
  eslint: {
    ignoreDuringBuilds: true, // Пропускать ошибки линтера
  },

  /* config options here */
  reactCompiler: true,
};

export default nextConfig;
