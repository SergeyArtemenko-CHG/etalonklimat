#!/usr/bin/env python3
"""
Единый пайплайн обработки изображений товаров:
1) Наложение водяного знака (public/logo-watermark.png) в правый нижний угол.
2) Ресайз до max 1200px по ширине (с сохранением пропорций).
3) Конвертация в WebP (quality=80).
4) Удаление исходных тяжелых файлов (.jpg/.jpeg/.png).

Запуск:
  python scripts/process_images.py
"""

from pathlib import Path
from PIL import Image, ImageOps, UnidentifiedImageError


ROOT = Path(__file__).resolve().parent.parent
SOURCE_DIR = ROOT / "public" / "images" / "products"
WATERMARK_PATH = ROOT / "public" / "logo-watermark.png"

MAX_WIDTH = 1200
WEBP_QUALITY = 80
WATERMARK_OPACITY = 0.25  # 25%
SUPPORTED_EXT = {".jpg", ".jpeg", ".png", ".webp"}


def apply_watermark(base_img: Image.Image, watermark_img: Image.Image) -> Image.Image:
    """Накладывает watermark в правый нижний угол."""
    base_rgba = base_img.convert("RGBA")

    # Ширина watermark: ~28% от ширины изображения
    target_wm_width = max(1, int(base_rgba.width * 0.28))
    wm = watermark_img.copy()
    if wm.width > target_wm_width:
        ratio = target_wm_width / wm.width
        wm = wm.resize(
            (target_wm_width, max(1, int(wm.height * ratio))),
            Image.Resampling.LANCZOS,
        )

    wm_rgba = wm.convert("RGBA")
    alpha = wm_rgba.split()[3].point(lambda p: int(p * WATERMARK_OPACITY))
    wm_rgba.putalpha(alpha)

    margin = max(8, int(base_rgba.width * 0.01))
    x = max(0, base_rgba.width - wm_rgba.width - margin)
    y = max(0, base_rgba.height - wm_rgba.height - margin)

    base_rgba.alpha_composite(wm_rgba, (x, y))
    return base_rgba


def resize_if_needed(img: Image.Image) -> Image.Image:
    """Уменьшает ширину до MAX_WIDTH при необходимости."""
    w, h = img.size
    if w <= MAX_WIDTH:
        return img
    new_h = max(1, int((MAX_WIDTH / w) * h))
    return img.resize((MAX_WIDTH, new_h), Image.Resampling.LANCZOS)


def convert_one(src: Path, watermark_img: Image.Image) -> bool:
    """Обработка одного файла."""
    target = src.with_suffix(".webp")
    tmp_target = target.with_name(f"{target.stem}.tmp.webp")

    try:
        with Image.open(src) as img:
            img = ImageOps.exif_transpose(img)
            img = apply_watermark(img, watermark_img)
            img = resize_if_needed(img)

            # Pillow лучше сохраняет WebP из RGB/RGBA
            if img.mode not in ("RGB", "RGBA"):
                img = img.convert("RGB")

            img.save(
                tmp_target,
                format="WEBP",
                quality=WEBP_QUALITY,
                method=6,
                optimize=True,
            )

        # Атомарная замена целевого файла
        tmp_target.replace(target)

        # Удаляем исходник, если это не тот же путь
        if src.resolve() != target.resolve():
            src.unlink(missing_ok=True)

        print(f"[OK] {src.relative_to(ROOT)} -> {target.relative_to(ROOT)}")
        return True

    except (UnidentifiedImageError, OSError, ValueError) as err:
        print(f"[SKIP] {src.relative_to(ROOT)}: {err}")
        tmp_target.unlink(missing_ok=True)
        return False


def main() -> None:
    if not SOURCE_DIR.exists():
        print(f"[ERROR] Папка не найдена: {SOURCE_DIR}")
        return
    if not WATERMARK_PATH.exists():
        print(f"[ERROR] Файл watermark не найден: {WATERMARK_PATH}")
        return

    files = [
        p
        for p in SOURCE_DIR.rglob("*")
        if p.is_file() and p.suffix.lower() in SUPPORTED_EXT
    ]
    if not files:
        print("[INFO] Подходящих файлов не найдено.")
        return

    with Image.open(WATERMARK_PATH) as watermark_img:
        converted = 0
        print(f"[INFO] Найдено файлов: {len(files)}")
        for file_path in files:
            if convert_one(file_path, watermark_img):
                converted += 1

    print(f"[DONE] Успешно обработано: {converted}/{len(files)}")


if __name__ == "__main__":
    main()

