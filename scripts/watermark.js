#!/usr/bin/env node

/**
 * Накладывает водяной знак на все изображения в public/images/products/.
 * Использование: node scripts/watermark.js
 */

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT_DIR = path.join(__dirname, "..");
const INPUT_DIR = path.join(ROOT_DIR, "public", "images", "products");
const OUTPUT_DIR = path.join(ROOT_DIR, "public", "images", "products-watermarked");
const WATERMARK_PATH = path.join(ROOT_DIR, "public", "logo-watermark.png");

const SUPPORTED_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);

async function collectFiles(dir) {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(fullPath)));
    } else if (entry.isFile() && SUPPORTED_EXT.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }

  return files;
}

async function main() {
  if (!fs.existsSync(INPUT_DIR)) {
    console.error("Input directory does not exist:", INPUT_DIR);
    process.exit(1);
  }
  if (!fs.existsSync(WATERMARK_PATH)) {
    console.error("Watermark file not found:", WATERMARK_PATH);
    process.exit(1);
  }

  const files = await collectFiles(INPUT_DIR);
  if (files.length === 0) {
    console.log("No images found in", INPUT_DIR);
    return;
  }

  console.log(`Found ${files.length} images. Processing...`);

  for (const inputPath of files) {
    const rel = path.relative(INPUT_DIR, inputPath);
    const outputPath = path.join(OUTPUT_DIR, rel);

    await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });

    try {
      // Узнаем размер оригинального изображения
      const image = sharp(inputPath);
      const metadata = await image.metadata();

      if (!metadata.width || !metadata.height) {
        console.warn("Skip image without dimensions:", rel);
        continue;
      }

      const baseWidth = metadata.width;
      const targetWmWidth = Math.max(Math.round(baseWidth * 0.3), 1);

      // Масштабируем водяной знак под ширину ~30% от оригинала
      const watermarkResizedBuffer = await sharp(WATERMARK_PATH)
        .resize({ width: targetWmWidth, fit: "inside" })
        .png()
        .toBuffer();

      await image
        .composite([
          {
            input: watermarkResizedBuffer,
            gravity: "southeast",
            opacity: 0.3,
          },
        ])
        .toFile(outputPath);

      console.log("Watermarked:", rel);
    } catch (e) {
      console.error("Failed to process", inputPath, e);
    }
  }

  console.log("Done. Output directory:", OUTPUT_DIR);
}

main().catch((e) => {
  console.error("Unexpected error in watermark script:", e);
  process.exit(1);
});

