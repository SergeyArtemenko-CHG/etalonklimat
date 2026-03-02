#!/usr/bin/env node
/**
 * Downloads Roboto-Regular.ttf to public/fonts for PDF generation (Cyrillic support).
 * Run: node scripts/download-roboto-font.cjs
 */
const fs = require("fs");
const path = require("path");
const https = require("https");

const FONT_URL =
  "https://github.com/googlefonts/roboto/raw/main/src/hinted/Roboto-Regular.ttf";
const OUT_DIR = path.join(__dirname, "..", "public", "fonts");
const OUT_FILE = path.join(OUT_DIR, "Roboto-Regular.ttf");

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

https
  .get(FONT_URL, (res) => {
    const chunks = [];
    res.on("data", (chunk) => chunks.push(chunk));
    res.on("end", () => {
      fs.writeFileSync(OUT_FILE, Buffer.concat(chunks));
      console.log("Roboto-Regular.ttf saved to public/fonts/");
    });
  })
  .on("error", (err) => {
    console.error("Download failed:", err.message);
    process.exit(1);
  });
