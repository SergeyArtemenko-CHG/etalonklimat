const fs = require("fs");
const path = require("path");
const Papa = require("papaparse");
const iconv = require("iconv-lite");

const projectRoot = __dirname ? path.join(__dirname, "..") : process.cwd();
// На Windows имя файла не чувствительно к регистру, поэтому достаточно одного варианта.
const csvPath = path.join(projectRoot, "Nomenclature.csv");
const outPath = path.join(projectRoot, "src", "data", "products.ts");
const productsImagesDir = path.join(projectRoot, "public", "images", "products");

function translit(str) {
  const map = {
    А: "A",
    а: "a",
    Б: "B",
    б: "b",
    В: "V",
    в: "v",
    Г: "G",
    г: "g",
    Д: "D",
    д: "d",
    Е: "E",
    е: "e",
    Ё: "E",
    ё: "e",
    Ж: "Zh",
    ж: "zh",
    З: "Z",
    з: "z",
    И: "I",
    и: "i",
    Й: "I",
    й: "i",
    К: "K",
    к: "k",
    Л: "L",
    л: "l",
    М: "M",
    м: "m",
    Н: "N",
    н: "n",
    О: "O",
    о: "o",
    П: "P",
    п: "p",
    Р: "R",
    р: "r",
    С: "S",
    с: "s",
    Т: "T",
    т: "t",
    У: "U",
    у: "u",
    Ф: "F",
    ф: "f",
    Х: "Kh",
    х: "kh",
    Ц: "Ts",
    ц: "ts",
    Ч: "Ch",
    ч: "ch",
    Ш: "Sh",
    ш: "sh",
    Щ: "Shch",
    щ: "shch",
    Ы: "Y",
    ы: "y",
    Э: "E",
    э: "e",
    Ю: "Yu",
    ю: "yu",
    Я: "Ya",
    я: "ya",
    Ь: "",
    ь: "",
    Ъ: "",
    ъ: "",
  };
  return Array.from(str)
    .map((ch) => map[ch] ?? ch)
    .join("");
}

function slugify(str) {
  const t = translit(str)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return t || "item";
}

function readCsvRows() {
  const raw = fs.readFileSync(csvPath);

  // Пробуем UTF‑8, при «кракозябрах» переходим на Windows‑1251.
  let csvText;
  try {
    csvText = raw.toString("utf8");
    if (csvText.includes("��")) {
      csvText = iconv.decode(raw, "win1251");
    }
  } catch {
    csvText = iconv.decode(raw, "win1251");
  }

  const parsed = Papa.parse(csvText, {
    header: false,
    delimiter: ";",
    skipEmptyLines: "greedy",
  });

  if (parsed.errors && parsed.errors.length) {
    console.error("Errors while parsing CSV:", parsed.errors.slice(0, 5));
  }

  return parsed.data;
}

function toTsString(value) {
  // Возвращаем корректный TS‑литерал строки, c экранированием спецсимволов.
  return JSON.stringify(value ?? "");
}

/** Извлекает число из строки мощности, удаляя всё кроме цифр и точки/запятой. */
function parsePower(value) {
  const s = (value ?? "").toString().trim();
  if (!s) return undefined;
  const cleaned = s.replace(/,/g, ".").replace(/[^\d.]/g, "");
  const m = cleaned.match(/[\d.]+/);
  if (!m) return undefined;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : undefined;
}

function normalizeImageFileName(value) {
  const raw = (value || "").toString().trim();
  if (!raw) return "no-image.webp";
  const baseName = path.basename(raw);
  if (/\.jpe?g$/i.test(baseName) || /\.png$/i.test(baseName)) {
    return baseName.replace(/\.(jpe?g|png)$/i, ".webp");
  }
  if (/\.webp$/i.test(baseName)) {
    return baseName;
  }
  // Если расширения нет/другое, приводим к webp, чтобы путь был единообразный.
  return `${baseName}.webp`;
}

function ensureImageFileCaseOnDisk(expectedFileName) {
  if (!expectedFileName || expectedFileName === "no-image.webp") return;
  if (!fs.existsSync(productsImagesDir)) return;

  const expectedPath = path.join(productsImagesDir, expectedFileName);
  if (fs.existsSync(expectedPath)) return;

  // Ищем файл без учета регистра в папке images/products
  const entries = fs.readdirSync(productsImagesDir, { withFileTypes: true });
  const expectedLower = expectedFileName.toLowerCase();
  const matched = entries.find(
    (e) => e.isFile() && e.name.toLowerCase() === expectedLower
  );
  if (!matched) return;

  const currentPath = path.join(productsImagesDir, matched.name);
  try {
    // Если отличается только регистр, на Windows нужен промежуточный rename
    const onlyCaseDiff = matched.name.toLowerCase() === expectedFileName.toLowerCase();
    if (onlyCaseDiff) {
      const tmpPath = path.join(
        productsImagesDir,
        `${expectedFileName}.tmp-rename-${Date.now()}`
      );
      fs.renameSync(currentPath, tmpPath);
      fs.renameSync(tmpPath, expectedPath);
    } else {
      fs.renameSync(currentPath, expectedPath);
    }
    console.log(`Renamed image: ${matched.name} -> ${expectedFileName}`);
  } catch (e) {
    console.warn(
      `Failed to normalize image file name on disk: ${matched.name} -> ${expectedFileName}`,
      e
    );
  }
}

function generateTsFile(categories, products) {
  const headerComment = `// AUTO-GENERATED FROM Nomenclature.csv. DO NOT EDIT DIRECTLY.
// Run \`node scripts/generate-products-from-csv.cjs\` to regenerate.

`;

  const categoriesBlock =
    categories.length === 0
      ? ""
      : categories
          .map(
            (cat) => `  {
    slug: ${toTsString(cat.slug)},
    name: ${toTsString(cat.name)},
    subCategories: [
${cat.subCategories
  .map(
    (sub) => `      { slug: ${toTsString(sub.slug)}, name: ${toTsString(sub.name)} },`
  )
  .join("\n")}
    ],
  }`
          )
          .join(",\n");

  const productsBlock =
    products.length === 0
      ? ""
      : products
          .map((p) => {
            const filesArray =
              p.files && p.files.length
                ? `[
${p.files
  .map(
    (f) =>
      `    { name: ${toTsString(f.name)}, url: ${toTsString(f.url)} },`
  )
  .join("\n")}
  ]`
                : "undefined";

            return `  {
    id: ${toTsString(p.id)},
    sku: ${toTsString(p.sku)},
    name: ${toTsString(p.name)},
    description: ${p.description ? toTsString(p.description) : "undefined"},
    longDescription: ${
      p.longDescription ? toTsString(p.longDescription) : "undefined"
    },
    priceEur: ${p.priceEur != null ? p.priceEur : "undefined"},
    priceRub: ${p.priceRub != null ? p.priceRub : "undefined"},
    partnerDiscount1: ${p.partnerDiscount1 != null ? p.partnerDiscount1 : "undefined"},
    partnerDiscount2: ${p.partnerDiscount2 != null ? p.partnerDiscount2 : "undefined"},
    partnerDiscount3: ${p.partnerDiscount3 != null ? p.partnerDiscount3 : "undefined"},
    brand: ${p.brand ? toTsString(p.brand) : "undefined"},
    burnerPowerMin: ${p.burnerPowerMin != null ? p.burnerPowerMin : "undefined"},
    burnerPowerMax: ${p.burnerPowerMax != null ? p.burnerPowerMax : "undefined"},
    fuelType: ${p.fuelType ? toTsString(p.fuelType) : "undefined"},
    boilerType: ${p.boilerType ? toTsString(p.boilerType) : "undefined"},
    heatExchangerMaterial: ${
      p.heatExchangerMaterial ? toTsString(p.heatExchangerMaterial) : "undefined"
    },
    category: ${toTsString(p.category)},
    categorySlug: ${toTsString(p.categorySlug)},
    subCategory: ${p.subCategory ? toTsString(p.subCategory) : "undefined"},
    subCategorySlug: ${
      p.subCategorySlug ? toTsString(p.subCategorySlug) : "undefined"
    },
    specs: ${p.specs && p.specs.length ? JSON.stringify(p.specs, null, 2) : "undefined"},
    files: ${filesArray},
    image: ${p.image ? toTsString(p.image) : "undefined"},
    leadTime: ${p.leadTime ? toTsString(p.leadTime) : "undefined"},
    inStock: ${p.inStock === false ? "false" : "undefined"},
  }`;
          })
          .join(",\n");

  const ts = `${headerComment}export type ProductSpec = {
  name: string;
  value: string;
};

export type ProductFile = {
  name: string;
  url: string;
};

export interface CategoryNode {
  slug: string;
  name: string;
  subCategories: { slug: string; name: string }[];
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  longDescription?: string;
  priceEur?: number;
  priceRub?: number;
  brand?: string;
  burnerPowerMin?: number;
  burnerPowerMax?: number;
  fuelType?: string;
  boilerType?: string;
  heatExchangerMaterial?: string;
  category: string;
  categorySlug: string;
  subCategory?: string;
  subCategorySlug?: string;
    specs?: ProductSpec[];
  files?: ProductFile[];
  image?: string;
  inStock?: boolean;
}

export const categories: CategoryNode[] = [
${categoriesBlock}
];

export const products: Product[] = [
${productsBlock}
];

export type CategoryMatch =
  | { kind: "category"; slug: string; name: string }
  | {
      kind: "subCategory";
      slug: string;
      name: string;
      parentSlug: string;
      parentName: string;
    };

export function getCategoryBySlug(slug: string): CategoryMatch | undefined {
  for (const category of categories) {
    if (category.slug === slug) {
      return { kind: "category", slug: category.slug, name: category.name };
    }
    const sub = category.subCategories.find((s) => s.slug === slug);
    if (sub) {
      return {
        kind: "subCategory",
        slug: sub.slug,
        name: sub.name,
        parentSlug: category.slug,
        parentName: category.name,
      };
    }
  }
  return undefined;
}

export function getProductsByCategory(slug: string): Product[] {
  const match = getCategoryBySlug(slug);
  if (!match) return [];

  if (match.kind === "category") {
    return products.filter((p) => p.categorySlug === match.slug);
  }

  return products.filter((p) => p.subCategorySlug === match.slug);
}

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id || p.sku === id);
}
`;

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, ts, "utf8");
  console.log(
    `Generated ${outPath} with ${products.length} products and ${categories.length} categories.`
  );
}

function main() {
  const rows = readCsvRows();
  if (!rows || rows.length < 2) {
    console.error("No data rows found in CSV.");
    return;
  }

  const [headerRow, ...dataRows] = rows;
  const headers = (headerRow || []).map((h) => (h || "").trim());
  const col = (name) => {
    const i = headers.findIndex((h) => h === name || h.includes(name));
    return i >= 0 ? i : -1;
  };

  /** @type {any[]} */
  const products = [];
  const categoryMap = new Map();
  const usedIds = new Set();

  const idxImageFile = col("Файл картинки");
  const idxBoilerType = col("Тип котла");
  const idxHeatExchanger = col("Материал теплообменника");
  const idxPriceRub = col("Цена РУБ");
  const idxDisc1 = col("Скидка партнера 1");
  const idxDisc2 = col("Скидка партнера 2");
  const idxDisc3 = col("Скидка партнера 3");
  const idxLeadTime = col("Срок поставки");
  const idxAvailability = col("Наличие");
  const idxSku = col("Артикул");
  const idxBoilerPower = col("Мощность котла, кВт");
  const idxSteamOutput = col("Паропроизводительность котла");
  const idxWorkingPressure = col("Рабочее давление котла");

  for (let index = 0; index < dataRows.length; index++) {
    const row = dataRows[index];
    if (!row) continue;

    const rawBoilerType = idxBoilerType >= 0 ? row[idxBoilerType] : row[17];
    const rawHeatExchanger =
      idxHeatExchanger >= 0 ? row[idxHeatExchanger] : row[18];
    const rawPriceRub =
      idxPriceRub >= 0 ? row[idxPriceRub] : row[12];
    const rawAvailability =
      idxAvailability >= 0 ? row[idxAvailability] : undefined;
    const rawDisc1 = idxDisc1 >= 0 ? row[idxDisc1] : undefined;
    const rawDisc2 = idxDisc2 >= 0 ? row[idxDisc2] : undefined;
    const rawDisc3 = idxDisc3 >= 0 ? row[idxDisc3] : undefined;
    const rawLeadTime = idxLeadTime >= 0 ? row[idxLeadTime] : undefined;
    const rawSku = idxSku >= 0 ? (row[idxSku] || "").toString().trim() : "";
    const rawBoilerPower =
      idxBoilerPower >= 0 ? (row[idxBoilerPower] || "").toString().trim() : "";
    const rawSteamOutput =
      idxSteamOutput >= 0 ? (row[idxSteamOutput] || "").toString().trim() : "";
    const rawWorkingPressure =
      idxWorkingPressure >= 0 ? (row[idxWorkingPressure] || "").toString().trim() : "";

    // CSV: Номенклатура;Вид номенклатуры;Подвид;Файл сертификат;Файл инструкция;Текстовое описание;Файл картинки;Цена Евро;Бренд;Мощность горелки мин., кВт;Мощность горелки макс., кВт;Вид топлива;Цена РУБ;...
    const rawImageFile =
      idxImageFile >= 0 ? row[idxImageFile] : row[6];
    const [
      rawName,
      rawCategory,
      rawSubCategory,
      rawCertFile,
      rawManualFile,
      rawDescription,
      _rawImageFileIgnored,
      rawPriceEur,
      rawBrand,
      rawPowerMin,
      rawPowerMax,
      rawFuelType,
    ] = row;

    const name = (rawName || "").trim();
    if (!name) continue;

    const categoryName = (rawCategory || "").trim();
    const subCategoryName = (rawSubCategory || "").trim();
    const certificateFile = (rawCertFile || "").trim();
    const manualFile = (rawManualFile || "").trim();
    const description = (rawDescription || "").trim();
    const imageFile = normalizeImageFileName(rawImageFile);
    ensureImageFileCaseOnDisk(imageFile);
    const priceEurRaw = (rawPriceEur || "").toString().trim();
    const brand = (rawBrand || "").trim();
    const burnerPowerMin = parsePower(rawPowerMin);
    const burnerPowerMax = parsePower(rawPowerMax);
    const fuelType = (rawFuelType || "").trim();
    const boilerType = (rawBoilerType || "").trim() || undefined;
    const heatExchangerMaterial =
      (rawHeatExchanger || "").trim() || undefined;

    const priceRubRaw = (rawPriceRub || "").toString().trim();
    const priceRubNum = priceRubRaw
      ? Number(priceRubRaw.replace(/\s/g, "").replace(",", "."))
      : NaN;
    const priceEurNum = priceEurRaw
      ? Number(priceEurRaw.replace(",", "."))
      : NaN;

    let priceEur;
    let priceRub;
    if (Number.isFinite(priceRubNum) && priceRubNum > 0) {
      priceRub = Math.round(priceRubNum);
    } else if (Number.isFinite(priceEurNum)) {
      priceEur = priceEurNum;
    } else {
      continue;
    }

    const baseId = slugify(name);
    let id = baseId;
    let counter = 2;
    while (usedIds.has(id)) {
      id = `${baseId}-${counter}`;
      counter += 1;
    }
    usedIds.add(id);

    const sku = rawSku || id;
    // inStock: только '1' или 1 = в наличии; '0', пусто или иное = false
    const inStock =
      rawAvailability === "1" || rawAvailability === 1;

    const categorySlug = categoryName ? slugify(categoryName) : "uncategorized";
    const subCategorySlug = subCategoryName ? slugify(subCategoryName) : "";

    if (categoryName) {
      if (!categoryMap.has(categorySlug)) {
        categoryMap.set(categorySlug, {
          slug: categorySlug,
          name: categoryName,
          subCategories: new Map(),
        });
      }
      const cat = categoryMap.get(categorySlug);
      if (subCategoryName) {
        if (!cat.subCategories.has(subCategorySlug)) {
          cat.subCategories.set(subCategorySlug, {
            slug: subCategorySlug,
            name: subCategoryName,
          });
        }
      }
    }

    const specs = [];
    if (rawBoilerPower) {
      specs.push({ name: "Мощность котла, кВт", value: rawBoilerPower });
    }
    if (rawSteamOutput) {
      specs.push({
        name: "Паропроизводительность котла, кг пара в час",
        value: rawSteamOutput,
      });
    }
    if (rawWorkingPressure) {
      specs.push({ name: "Рабочее давление котла, бар", value: rawWorkingPressure });
    }

    const files = [];
    if (certificateFile) {
      files.push({
        name: "Сертификат",
        url: `/docs-watermarked/certificates/${certificateFile}`,
      });
    }
    if (manualFile) {
      files.push({
        name: "Инструкция",
        url: `/docs-watermarked/manuals/${manualFile}`,
      });
    }

    const disc1 = rawDisc1 != null && `${rawDisc1}`.trim() !== ""
      ? Number(`${rawDisc1}`.toString().replace(",", "."))
      : NaN;
    const disc2 = rawDisc2 != null && `${rawDisc2}`.trim() !== ""
      ? Number(`${rawDisc2}`.toString().replace(",", "."))
      : NaN;
    const disc3 = rawDisc3 != null && `${rawDisc3}`.trim() !== ""
      ? Number(`${rawDisc3}`.toString().replace(",", "."))
      : NaN;

    const leadTime =
      rawLeadTime != null && `${rawLeadTime}`.trim() !== ""
        ? `${rawLeadTime}`.toString().trim()
        : undefined;

    const product = {
      id,
      sku,
      name,
      description: description || undefined,
      longDescription: undefined,
      priceEur: priceEur ?? undefined,
      priceRub: priceRub ?? undefined,
      brand: brand || undefined,
      burnerPowerMin: burnerPowerMin ?? undefined,
      burnerPowerMax: burnerPowerMax ?? undefined,
      fuelType: fuelType || undefined,
      boilerType,
      heatExchangerMaterial,
      category: categoryName || "",
      categorySlug,
      subCategory: subCategoryName || undefined,
      subCategorySlug: subCategorySlug || undefined,
      specs: specs.length ? specs : undefined,
      files: files.length ? files : undefined,
      image: `/images/products/${imageFile}`,
      inStock,
      partnerDiscount1: Number.isFinite(disc1) ? disc1 : undefined,
      partnerDiscount2: Number.isFinite(disc2) ? disc2 : undefined,
      partnerDiscount3: Number.isFinite(disc3) ? disc3 : undefined,
      leadTime,
    };

    products.push(product);
  }

  const categoryArray = Array.from(categoryMap.values()).map((cat) => ({
    slug: cat.slug,
    name: cat.name,
    subCategories: Array.from(cat.subCategories.values()),
  }));

  products.sort((a, b) => a.name.localeCompare(b.name, "ru"));
  categoryArray.sort((a, b) => a.name.localeCompare(b.name, "ru"));
  for (const cat of categoryArray) {
    cat.subCategories.sort((a, b) => a.name.localeCompare(b.name, "ru"));
  }

  generateTsFile(categoryArray, products);
}

main();
