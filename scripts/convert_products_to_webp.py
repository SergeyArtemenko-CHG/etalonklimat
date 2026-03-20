#!/usr/bin/env python3
"""
Оптимизация изображений товаров:
- Сканирует public/images/products
- Конвертирует .jpg/.jpeg/.png -> .webp
- Ограничивает ширину до 1200px с сохранением пропорций
- Качество WebP: 80
- Сохраняет результат рядом и удаляет исходный файл
"""

from pathlib import Path
from PIL import Image, ImageOps, UnidentifiedImageError


SOURCE_DIR = Path("public/images/products")
MAX_WIDTH = 1200
WEBP_QUALITY = 80
SUPPORTED_EXT = {".jpg", ".jpeg", ".png"}


def make_unique_target(path: Path) -> Path:
    """Если .webp с таким именем уже есть, создаем уникальное имя."""
    if not path.exists():
        return path
    index = 1
    while True:
        candidate = path.with_name(f"{path.stem}_{index}{path.suffix}")
        if not candidate.exists():
            return candidate
        index += 1


def convert_file(src: Path) -> bool:
    """Конвертирует один файл в WebP. Возвращает True при успехе."""
    target = make_unique_target(src.with_suffix(".webp"))
    try:
        with Image.open(src) as img:
            img = ImageOps.exif_transpose(img)
            width, height = img.size

            if width > MAX_WIDTH:
                new_height = int((MAX_WIDTH / width) * height)
                img = img.resize((MAX_WIDTH, new_height), Image.Resampling.LANCZOS)

            # Для JPEG убираем альфа-канал, для PNG оставляем прозрачность
            if src.suffix.lower() in {".jpg", ".jpeg"} and img.mode not in ("RGB", "L"):
                img = img.convert("RGB")

            img.save(
                target,
                format="WEBP",
                quality=WEBP_QUALITY,
                method=6,
                optimize=True,
            )

        src.unlink()
        print(f"[OK] {src} -> {target}")
        return True
    except (UnidentifiedImageError, OSError, ValueError) as err:
        print(f"[SKIP] {src}: {err}")
        return False


def main() -> None:
    if not SOURCE_DIR.exists():
        print(f"[ERROR] Папка не найдена: {SOURCE_DIR}")
        return

    files = [p for p in SOURCE_DIR.rglob("*") if p.is_file() and p.suffix.lower() in SUPPORTED_EXT]
    if not files:
        print("[INFO] Подходящих .jpg/.jpeg/.png файлов не найдено.")
        return

    print(f"[INFO] Найдено файлов: {len(files)}")
    converted = 0
    for file_path in files:
        if convert_file(file_path):
            converted += 1

    print(f"[DONE] Успешно конвертировано: {converted}/{len(files)}")


if __name__ == "__main__":
    main()

