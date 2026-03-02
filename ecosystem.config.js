/**
 * PM2 config for etma-pro.ru (Next.js).
 * На сервере: npm run build && pm2 start ecosystem.config.js
 * Убедитесь, что cwd указывает на корень проекта.
 */
module.exports = {
  apps: [
    {
      name: "etma-pro",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: "./",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};
