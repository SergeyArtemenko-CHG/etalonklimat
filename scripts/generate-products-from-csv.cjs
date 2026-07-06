const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");
const iconv = require("iconv-lite");

const projectRoot = __dirname ? path.join(__dirname, "..") : process.cwd();
const nomenclatureDir = path.join(projectRoot, "data", "nomenclature");
const outPath = path.join(projectRoot, "src", "data", "products.ts");
const brandsOutPath = path.join(projectRoot, "src", "data", "brands.ts");
const productsImagesDir = path.join(projectRoot, "public", "images", "products");

const BRANDS_CSV_NAME = "brands.csv";

/** Колонки файла data/nomenclature/Brands.csv */
const BRAND_COLUMN_ALIASES = {
  name: ["Бренд", "Название", "Наименование", "Название бренда"],
  logo: ["Файл логотип", "Логотип", "Файл логотипа"],
  heading: ["Заголовок", "H1", "Title", "SEO-заголовок"],
  description: ["Описание"],
  slug: ["Слаг", "Slug", "ЧПУ", "URL"],
};

const BASE_COLUMNS = [
  "Артикул",
  "Номенклатура",
  "Вид номенклатуры",
  "Подвид",
  "Текстовое описание",
  "Файл картинки",
  "Цена Евро",
  "Цена РУБ",
  "Бренд",
  "Наличие",
  "Скидка партнера 1",
  "Скидка партнера 2",
  "Скидка партнера 3",
  "Срок поставки",
  "Файл сертификат",
  "Файл инструкция",
];

const BASE_KEYS = {
  sku: "Артикул",
  name: "Номенклатура",
  category: "Вид номенклатуры",
  subCategory: "Подвид",
  description: "Текстовое описание",
  image: "Файл картинки",
  priceEur: "Цена Евро",
  priceRub: "Цена РУБ",
  brand: "Бренд",
  availability: "Наличие",
  disc1: "Скидка партнера 1",
  disc2: "Скидка партнера 2",
  disc3: "Скидка партнера 3",
  leadTime: "Срок поставки",
  cert: "Файл сертификат",
  manual: "Файл инструкция",
};

const BASE_KEY_ALIASES = {
  sku: ["Артикул"],
  name: ["Номенклатура"],
  category: ["Вид номенклатуры"],
  subCategory: ["Подвид"],
  description: ["Текстовое описание", "Текстовое описание2"],
  image: ["Файл картинки"],
  priceEur: ["Цена Евро"],
  priceRub: ["Цена РУБ"],
  brand: ["Бренд"],
  availability: ["Наличие"],
  disc1: ["Скидка партнера 1"],
  disc2: ["Скидка партнера 2"],
  disc3: ["Скидка партнера 3"],
  leadTime: ["Срок поставки"],
  cert: ["Файл сертификат"],
  manual: ["Файл инструкция"],
  popular: ["Популярные товары"],
};

const INTERNAL_SPEC_KEYS = new Set(["Популярные товары"]);

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

function normalizeHeaderName(value) {
  return (value || "")
    .toString()
    .replace(/\uFEFF/g, "")
    .replace(/\u00A0/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function parseSpecHeader(rawHeader) {
  const normalized = normalizeHeaderName(rawHeader);
  const filterable = normalized.startsWith("*");
  const cleanName = normalized.replace(/^\*+\s*/, "").trim();
  return { cleanName, filterable };
}

function normalizeHeaderForMatch(value) {
  return normalizeHeaderName(value).replace(/^\*+\s*/, "").trim().toLowerCase();
}

function decodeCsvText(raw) {
  try {
    const utf8 = raw.toString("utf8");
    if (utf8.includes("��")) {
      return iconv.decode(raw, "win1251");
    }
    return utf8;
  } catch {
    return iconv.decode(raw, "win1251");
  }
}

function listCsvFiles() {
  if (!fs.existsSync(nomenclatureDir)) {
    throw new Error(`Directory not found: ${nomenclatureDir}`);
  }
  return fs
    .readdirSync(nomenclatureDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".csv"))
    .map((entry) => path.join(nomenclatureDir, entry.name))
    .sort((a, b) => a.localeCompare(b, "ru"));
}

function readCsvRows(filePath) {
  const raw = fs.readFileSync(filePath);
  const csvText = decodeCsvText(raw);
  return parse(csvText, {
    delimiter: ";",
    skip_empty_lines: true,
    relax_column_count: true,
    bom: true,
  });
}

function readDatasetRows() {
  const files = listCsvFiles();
  if (!files.length) {
    throw new Error(`No .csv files in ${nomenclatureDir}`);
  }
  const allRows = [];
  for (const filePath of files) {
    if (path.basename(filePath).toLowerCase() === BRANDS_CSV_NAME) {
      continue;
    }
    const rows = readCsvRows(filePath);
    if (!rows || rows.length < 2) {
      console.warn(`Skip empty CSV: ${path.basename(filePath)}`);
      continue;
    }
    const [headerRow, ...dataRows] = rows;
    const headers = (headerRow || []).map(normalizeHeaderName);
    allRows.push({ filePath, headers, dataRows });
  }
  return allRows;
}

function toTsString(value) {
  return JSON.stringify(value ?? "");
}

function parsePower(value) {
  const s = (value ?? "").toString().trim();
  if (!s) return undefined;
  const cleaned = s.replace(/,/g, ".").replace(/[^\d.]/g, "");
  const m = cleaned.match(/[\d.]+/);
  if (!m) return undefined;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : undefined;
}

function parsePrice(rawValue) {
  if (rawValue == null) return NaN;
  const s = `${rawValue}`.trim();
  if (!s) return NaN;
  const normalized = s.replace(/\s/g, "").replace(",", ".");
  return parseFloat(normalized);
}

function parseDiscount(rawValue) {
  if (rawValue == null) return undefined;
  const s = `${rawValue}`.trim();
  if (!s) return undefined;
  const value = Number(s.replace(",", "."));
  return Number.isFinite(value) ? value : undefined;
}

function isNumericSpecValue(rawValue) {
  if (rawValue == null) return false;
  const s = `${rawValue}`.trim();
  if (!s) return false;
  const normalized = s.replace(/\s/g, "").replace(",", ".");
  return Number.isFinite(parseFloat(normalized));
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
  return `${baseName}.webp`;
}

function ensureImageFileCaseOnDisk(expectedFileName) {
  if (!expectedFileName || expectedFileName === "no-image.webp") return;
  if (!fs.existsSync(productsImagesDir)) return;

  const expectedPath = path.join(productsImagesDir, expectedFileName);
  if (fs.existsSync(expectedPath)) return;

  const entries = fs.readdirSync(productsImagesDir, { withFileTypes: true });
  const expectedLower = expectedFileName.toLowerCase();
  const matched = entries.find(
    (e) => e.isFile() && e.name.toLowerCase() === expectedLower
  );
  if (!matched) return;

  const currentPath = path.join(productsImagesDir, matched.name);
  try {
    const onlyCaseDiff =
      matched.name.toLowerCase() === expectedFileName.toLowerCase();
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

function findFirstColumnIndex(headers, aliases) {
  for (const alias of aliases) {
    const target = normalizeHeaderForMatch(alias);
    for (let i = 0; i < headers.length; i++) {
      if (normalizeHeaderForMatch(headers[i]) === target) {
        return i;
      }
    }
  }
  return -1;
}

function normalizeManualSlug(raw) {
  const t = `${raw || ""}`.trim().toLowerCase();
  if (!t) return "";
  return t
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Короткий slug из имени файла лого: EGS.png → egs, EXECO_logo.png → execo */
function slugFromLogoFileName(logoRaw) {
  const base = path.basename(`${logoRaw || ""}`.trim());
  if (!base || !base.includes(".")) return "";
  const stem = base.slice(0, base.lastIndexOf(".")).toLowerCase();
  const trimmed = stem.replace(/_logo$/i, "").replace(/[^a-z0-9]+/g, "");
  if (trimmed.length >= 2 && trimmed.length <= 32) return trimmed;
  return "";
}

/**
 * Читает только data/nomenclature/Brands.csv (не смешивается с номенклатурой).
 */
function parseBrandsCsv() {
  const filePath = path.join(nomenclatureDir, "Brands.csv");
  if (!fs.existsSync(filePath)) {
    console.warn(`Brands.csv not found at ${filePath} — featuredBrands will be empty.`);
    return [];
  }
  const rows = readCsvRows(filePath);
  if (!rows || rows.length < 2) {
    console.warn("Brands.csv is empty or has no data rows.");
    return [];
  }
  const [headerRow, ...dataRows] = rows;
  const headers = (headerRow || []).map(normalizeHeaderName);
  const idxName = findFirstColumnIndex(headers, BRAND_COLUMN_ALIASES.name);
  const idxLogo = findFirstColumnIndex(headers, BRAND_COLUMN_ALIASES.logo);
  const idxHeading = findFirstColumnIndex(
    headers,
    BRAND_COLUMN_ALIASES.heading
  );
  const idxDesc = findFirstColumnIndex(headers, BRAND_COLUMN_ALIASES.description);
  const idxSlug = findFirstColumnIndex(headers, BRAND_COLUMN_ALIASES.slug);
  if (idxName < 0 || idxLogo < 0) {
    console.warn(
      "Brands.csv: нужны колонки «Бренд» и «Файл логотип» — карточки брендов не сгенерированы."
    );
    return [];
  }

  const brands = [];
  const usedSlugs = new Set();

  for (const row of dataRows) {
    if (!row) continue;
    const name = `${row[idxName] ?? ""}`.trim();
    if (!name) continue;
    const logoRaw = `${row[idxLogo] ?? ""}`.trim();
    const baseFile = path.basename(logoRaw);
    if (!baseFile) continue;
    const heading =
      idxHeading >= 0 ? `${row[idxHeading] ?? ""}`.trim() : "";
    const description =
      idxDesc >= 0 ? `${row[idxDesc] ?? ""}`.trim() : "";

    let slug =
      idxSlug >= 0 ? normalizeManualSlug(`${row[idxSlug] ?? ""}`) : "";
    if (!slug) {
      slug = slugFromLogoFileName(logoRaw);
    }
    if (!slug) {
      slug = slugify(name);
    }
    let uniqueSlug = slug;
    let n = 2;
    while (usedSlugs.has(uniqueSlug)) {
      uniqueSlug = `${slug}-${n}`;
      n += 1;
    }
    usedSlugs.add(uniqueSlug);

    brands.push({
      name,
      slug: uniqueSlug,
      logo: `/images/brands/${baseFile}`,
      heading,
      description,
    });
  }

  return brands;
}

function generateBrandsTsFile(brands) {
  const headerComment = `// AUTO-GENERATED FROM data/nomenclature/Brands.csv. DO NOT EDIT DIRECTLY.
// Run: node scripts/generate-products-from-csv.cjs
//
// CSV (;): Бренд; Файл логотип; Заголовок; Описание [; Слаг]
// Опционально «Слаг» — URL /brands/..., иначе slug из названия.

`;

  const block =
    brands.length === 0
      ? ""
      : brands
          .map(
            (b) => `  {
    name: ${toTsString(b.name)},
    slug: ${toTsString(b.slug)},
    logo: ${toTsString(b.logo)},
    heading: ${toTsString(b.heading)},
    description: ${toTsString(b.description)},
  }`
          )
          .join(",\n");

  const ts = `${headerComment}export interface FeaturedBrand {
  name: string;
  slug: string;
  logo: string;
  heading: string;
  description: string;
}

export const featuredBrands: FeaturedBrand[] = [
${block}
];

export function getFeaturedBrandBySlug(slug: string): FeaturedBrand | undefined {
  const key = (slug || "").trim().toLowerCase();
  return featuredBrands.find((b) => b.slug.toLowerCase() === key);
}
`;

  fs.mkdirSync(path.dirname(brandsOutPath), { recursive: true });
  fs.writeFileSync(brandsOutPath, ts, "utf8");
  console.log(`Generated ${brandsOutPath} with ${brands.length} brands.`);
}

function generateTsFile(categories, products, specFieldMeta, specFieldOrder) {
  const headerComment = `// AUTO-GENERATED FROM data/nomenclature/*.csv. DO NOT EDIT DIRECTLY.
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
    slug: ${toTsString(p.slug)},
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
    specs: ${p.specs && Object.keys(p.specs).length ? JSON.stringify(p.specs, null, 2) : "undefined"},
    files: ${filesArray},
    image: ${p.image ? toTsString(p.image) : "undefined"},
    leadTime: ${p.leadTime ? toTsString(p.leadTime) : "undefined"},
    inStock: ${p.inStock === false ? "false" : "undefined"},
    popular: ${p.popular === true ? "true" : "undefined"},
  }`;
          })
          .join(",\n");

  const ts = `${headerComment}export type ProductSpecs = Record<string, string>;
export type SpecFieldMeta = { isNumeric: boolean; filterable: boolean };

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
  /** ЧПУ для URL /product/[slug] */
  slug: string;
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
  specs?: ProductSpecs;
  files?: ProductFile[];
  image?: string;
  inStock?: boolean;
  partnerDiscount1?: number;
  partnerDiscount2?: number;
  partnerDiscount3?: number;
  leadTime?: string;
  popular?: boolean;
}

export const categories: CategoryNode[] = [
${categoriesBlock}
];

export const products: Product[] = [
${productsBlock}
];

export const specFieldMeta: Record<string, SpecFieldMeta> = ${JSON.stringify(
    specFieldMeta,
    null,
    2
  )};

export const specFieldOrder: string[] = ${JSON.stringify(specFieldOrder, null, 2)};

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

export function getProductBySlug(slug: string): Product | undefined {
  const normalized = (slug || "").toString().trim().toLowerCase();
  return products.find((p) => {
    const ps = (p.slug || "").toString().trim().toLowerCase();
    const sku = (p.sku || "").toString().trim().toLowerCase();
    const pid = (p.id || "").toString().trim().toLowerCase();
    return ps === normalized || sku === normalized || pid === normalized;
  });
}

export function getProductById(id: string): Product | undefined {
  return getProductBySlug(id);
}
`;

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, ts, "utf8");
  console.log(
    `Generated ${outPath} with ${products.length} products and ${categories.length} categories.`
  );
}

function main() {
  const datasets = readDatasetRows();

  const products = [];
  const categoryMap = new Map();
  const usedIds = new Set();
  const usedSlugs = new Set();
  const specStats = new Map();
  const specOrder = [];
  const seenSpecOrder = new Set();

  for (const dataset of datasets) {
    const { headers, dataRows } = dataset;
    const headerIndex = new Map();
    headers.forEach((h, idx) => {
      if (h) headerIndex.set(h, idx);
    });

    const findHeaderIndex = (candidates) => {
      for (const candidate of candidates) {
        const normalizedTarget = normalizeHeaderForMatch(candidate);
        for (const [headerName, index] of headerIndex.entries()) {
          if (normalizeHeaderForMatch(headerName) === normalizedTarget) {
            return index;
          }
        }
      }
      return -1;
    };
    const baseKeyToIndex = {
      sku: findHeaderIndex(BASE_KEY_ALIASES.sku),
      name: findHeaderIndex(BASE_KEY_ALIASES.name),
      category: findHeaderIndex(BASE_KEY_ALIASES.category),
      subCategory: findHeaderIndex(BASE_KEY_ALIASES.subCategory),
      description: findHeaderIndex(BASE_KEY_ALIASES.description),
      image: findHeaderIndex(BASE_KEY_ALIASES.image),
      priceEur: findHeaderIndex(BASE_KEY_ALIASES.priceEur),
      priceRub: findHeaderIndex(BASE_KEY_ALIASES.priceRub),
      brand: findHeaderIndex(BASE_KEY_ALIASES.brand),
      availability: findHeaderIndex(BASE_KEY_ALIASES.availability),
      disc1: findHeaderIndex(BASE_KEY_ALIASES.disc1),
      disc2: findHeaderIndex(BASE_KEY_ALIASES.disc2),
      disc3: findHeaderIndex(BASE_KEY_ALIASES.disc3),
      leadTime: findHeaderIndex(BASE_KEY_ALIASES.leadTime),
      cert: findHeaderIndex(BASE_KEY_ALIASES.cert),
      manual: findHeaderIndex(BASE_KEY_ALIASES.manual),
      popular: findHeaderIndex(BASE_KEY_ALIASES.popular),
    };
    for (const row of dataRows) {
      if (!row) continue;

      const rawSku =
        baseKeyToIndex.sku >= 0 ? `${row[baseKeyToIndex.sku] ?? ""}`.trim() : "";
      const rawName =
        baseKeyToIndex.name >= 0 ? `${row[baseKeyToIndex.name] ?? ""}` : "";
      const rawCategory =
        baseKeyToIndex.category >= 0 ? `${row[baseKeyToIndex.category] ?? ""}` : "";
      const rawSubCategory =
        baseKeyToIndex.subCategory >= 0
          ? `${row[baseKeyToIndex.subCategory] ?? ""}`
          : "";
      const rawDescription =
        baseKeyToIndex.description >= 0
          ? `${row[baseKeyToIndex.description] ?? ""}`
          : "";
      const rawImageFile =
        baseKeyToIndex.image >= 0 ? `${row[baseKeyToIndex.image] ?? ""}` : "";
      const rawPriceEur =
        baseKeyToIndex.priceEur >= 0 ? `${row[baseKeyToIndex.priceEur] ?? ""}` : "";
      const rawPriceRub =
        baseKeyToIndex.priceRub >= 0 ? `${row[baseKeyToIndex.priceRub] ?? ""}` : "";
      const rawBrand =
        baseKeyToIndex.brand >= 0 ? `${row[baseKeyToIndex.brand] ?? ""}` : "";
      const rawAvailability =
        baseKeyToIndex.availability >= 0 ? row[baseKeyToIndex.availability] : "";
      const rawDisc1 = baseKeyToIndex.disc1 >= 0 ? row[baseKeyToIndex.disc1] : "";
      const rawDisc2 = baseKeyToIndex.disc2 >= 0 ? row[baseKeyToIndex.disc2] : "";
      const rawDisc3 = baseKeyToIndex.disc3 >= 0 ? row[baseKeyToIndex.disc3] : "";
      const rawLeadTime =
        baseKeyToIndex.leadTime >= 0 ? row[baseKeyToIndex.leadTime] : "";
      const rawCertFile =
        baseKeyToIndex.cert >= 0 ? `${row[baseKeyToIndex.cert] ?? ""}` : "";
      const rawManualFile =
        baseKeyToIndex.manual >= 0 ? `${row[baseKeyToIndex.manual] ?? ""}` : "";
      const rawPopular =
        baseKeyToIndex.popular >= 0 ? `${row[baseKeyToIndex.popular] ?? ""}` : "";

      const name = rawName.trim();
      if (!name) continue;

      const categoryName = rawCategory.trim();
      const subCategoryName = rawSubCategory.trim();
      const certificateFile = rawCertFile.trim();
      const manualFile = rawManualFile.trim();
      const description = rawDescription.trim();
      const imageFile = normalizeImageFileName(rawImageFile);
      ensureImageFileCaseOnDisk(imageFile);
      const priceRubNum = parsePrice(rawPriceRub);
      const priceEurNum = parsePrice(rawPriceEur);
      const brand = rawBrand.trim();

      const specs = {};
      let isPopular = parseFloat(rawPopular.replace(",", ".").trim()) > 0;
      const specsStartIndex =
        baseKeyToIndex.manual >= 0 ? baseKeyToIndex.manual + 1 : 16;
      for (let colIndex = specsStartIndex; colIndex < headers.length; colIndex++) {
        const { cleanName: specName, filterable } = parseSpecHeader(headers[colIndex]);
        if (!specName) continue;
        const specValue = (row[colIndex] ?? "").toString().trim();

        if (INTERNAL_SPEC_KEYS.has(specName)) {
          if (specName === "Популярные товары") {
            isPopular = isPopular || parseFloat(specValue.replace(",", ".").trim()) > 0;
          }
          continue;
        }

        if (!seenSpecOrder.has(specName)) {
          seenSpecOrder.add(specName);
          specOrder.push(specName);
        }
        if (!specValue) continue;
        specs[specName] = specValue;
        const stat = specStats.get(specName) || { total: 0, numeric: 0, filterable: false };
        stat.total += 1;
        if (isNumericSpecValue(specValue)) stat.numeric += 1;
        stat.filterable = stat.filterable || filterable;
        specStats.set(specName, stat);
      }

      let priceEur;
      let priceRub;
      if (Number.isFinite(priceRubNum) && priceRubNum > 0) {
        priceRub = Math.round(priceRubNum);
      } else if (Number.isFinite(priceEurNum) && priceEurNum > 0) {
        priceEur = priceEurNum;
      } else {
        continue;
      }

      const sku = rawSku || slugify(name);
      let id = sku;
      let counter = 2;
      while (usedIds.has(id.toLowerCase())) {
        id = `${sku}-${counter}`;
        counter += 1;
      }
      usedIds.add(id.toLowerCase());

      let productSlug = slugify(name);
      if (usedSlugs.has(productSlug)) {
        productSlug = `${productSlug}-${sku}`;
      }
      if (usedSlugs.has(productSlug)) {
        productSlug = `${productSlug}-${id}`;
      }
      usedSlugs.add(productSlug);

      const inStock = `${rawAvailability ?? ""}`.trim() === "1";
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

      products.push({
        id,
        sku,
        slug: productSlug,
        name,
        description: description || undefined,
        longDescription: undefined,
        priceEur: priceEur ?? undefined,
        priceRub: priceRub ?? undefined,
        brand: brand || undefined,
        burnerPowerMin: parsePower(specs["Мощность горелки мин., кВт"]),
        burnerPowerMax: parsePower(specs["Мощность горелки макс., кВт"]),
        fuelType: specs["Вид топлива"] || undefined,
        boilerType: specs["Тип котла"] || undefined,
        heatExchangerMaterial: specs["Материал теплообменника"] || undefined,
        category: categoryName || "",
        categorySlug,
        subCategory: subCategoryName || undefined,
        subCategorySlug: subCategorySlug || undefined,
        specs: Object.keys(specs).length ? specs : undefined,
        files: files.length ? files : undefined,
        image: `/images/products/${imageFile}`,
        inStock,
        partnerDiscount1: parseDiscount(rawDisc1),
        partnerDiscount2: parseDiscount(rawDisc2),
        partnerDiscount3: parseDiscount(rawDisc3),
        popular: isPopular || undefined,
        leadTime:
          rawLeadTime != null && `${rawLeadTime}`.trim() !== ""
            ? `${rawLeadTime}`.toString().trim()
            : undefined,
      });
    }
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

  const specFieldMeta = {};
  for (const [key, stat] of specStats.entries()) {
    specFieldMeta[key] = {
      isNumeric: stat.numeric > 0 && stat.numeric >= stat.total * 0.6,
      filterable: !!stat.filterable,
    };
  }

  generateTsFile(categoryArray, products, specFieldMeta, specOrder);
  generateBrandsTsFile(parseBrandsCsv());
}

main();
