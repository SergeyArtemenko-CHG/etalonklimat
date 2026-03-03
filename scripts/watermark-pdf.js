#!/usr/bin/env node

/**
 * Накладывает водяной знак (public/logo-watermark.png) на все PDF-файлы
 * в папке public/docs/ и сохраняет результат в public/docs-watermarked/,
 * сохраняя структуру подпапок.
 *
 * Использование: node scripts/watermark-pdf.js
 */

const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

const ROOT_DIR = path.join(__dirname, "..");
const INPUT_DIR = path.join(ROOT_DIR, "public", "docs");
const OUTPUT_DIR = path.join(ROOT_DIR, "public", "docs-watermarked");
const WATERMARK_PATH = path.join(ROOT_DIR, "public", "logo-watermark.png");

async function collectPdfFiles(dir) {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectPdfFiles(fullPath)));
    } else if (entry.isFile() && fullPath.toLowerCase().endsWith(".pdf")) {
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
    console.error("Watermark image not found:", WATERMARK_PATH);
    process.exit(1);
  }

  console.log("Loading watermark image from", WATERMARK_PATH);
  const watermarkBytes = await fs.promises.readFile(WATERMARK_PATH);

  const files = await collectPdfFiles(INPUT_DIR);
  if (files.length === 0) {
    console.log("No PDF files found in", INPUT_DIR);
    return;
  }

  console.log(`Found ${files.length} PDF files. Processing...`);

  for (const inputPath of files) {
    const rel = path.relative(INPUT_DIR, inputPath);
    const outputPath = path.join(OUTPUT_DIR, rel);

    await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });

    try {
      const pdfBytes = await fs.promises.readFile(inputPath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pngImage = await pdfDoc.embedPng(watermarkBytes);

      const pages = pdfDoc.getPages();
      for (const page of pages) {
        const { width, height } = page.getSize();

        // Масштабируем логотип примерно до 50% ширины страницы
        const targetWidth = width * 0.5;
        const scale = targetWidth / pngImage.width;
        const wmWidth = pngImage.width * scale;
        const wmHeight = pngImage.height * scale;

        const x = (width - wmWidth) / 2;
        const y = (height - wmHeight) / 2;

        page.drawImage(pngImage, {
          x,
          y,
          width: wmWidth,
          height: wmHeight,
          opacity: 0.2,
        });
      }

      const outBytes = await pdfDoc.save();
      await fs.promises.writeFile(outputPath, outBytes);
      console.log("Watermarked PDF:", rel);
    } catch (e) {
      console.error("Failed to process PDF:", inputPath, e);
    }
  }

  console.log("Done. Output directory:", OUTPUT_DIR);
}

main().catch((e) => {
  console.error("Unexpected error in watermark-pdf script:", e);
  process.exit(1);
});

