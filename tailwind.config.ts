import type { Config } from "tailwindcss";

export default {
  theme: {
    extend: {
      colors: {
        primary: "var(--primary)",
        "primary-hover": "var(--primary-hover)",
        "main-bg": "var(--bg-main)",
        "card-bg": "var(--bg-card)",
        "text-main": "var(--text-main)",
        "text-muted": "var(--text-muted)",
        accent: "var(--accent)",
        "accent-hover": "var(--accent-hover)",
        "auth-bg": "var(--auth-bg)",
        "hero-from": "var(--hero-from)",
        "hero-to": "var(--hero-to)",
        "hero-text": "var(--hero-text)",
        "hero-lead": "var(--hero-lead)",
        "surface-tint": "var(--surface-tint)",
      },
    },
  },
} satisfies Config;
