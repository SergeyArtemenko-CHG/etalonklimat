import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true, // Пропускать ошибки типов при сборке
  },

  /* config options here */
  reactCompiler: true,
};

export default nextConfig;
