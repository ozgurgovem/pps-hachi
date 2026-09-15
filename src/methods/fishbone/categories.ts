import type { A3Language } from "../../a3/methodContract";

/**
 * D-11: Fishbone is Step 4 only. D-104: 6M is 5M1E's six categories plus a
 * distinct Management axis (not a bare synonym for 5M1E); 8P is the
 * standard service-industry set. Category ids are stable slugs — reused
 * across sets that share a category (e.g. "man" appears in 4M/5M1E/6M) so
 * i18n keys never fork per set.
 */
export const FISHBONE_CATEGORY_SETS = ["4M", "5M1E", "6M", "8P"] as const;
export type FishboneCategorySet = (typeof FISHBONE_CATEGORY_SETS)[number];

const FOUR_M = ["man", "machine", "material", "method"] as const;
const FIVE_M_ONE_E = [...FOUR_M, "measurement", "environment"] as const;
const SIX_M = [...FIVE_M_ONE_E, "management"] as const;
const EIGHT_P = [
  "price",
  "product",
  "place",
  "promotion",
  "people",
  "process",
  "physicalEvidence",
  "productivity",
] as const;

export const FISHBONE_CATEGORY_IDS: Readonly<Record<FishboneCategorySet, readonly string[]>> = {
  "4M": FOUR_M,
  "5M1E": FIVE_M_ONE_E,
  "6M": SIX_M,
  "8P": EIGHT_P,
};

/** i18next key for a category id's display label — shared across every set that includes it. */
export function categoryLabelKey(categoryId: string): string {
  return `methods.fishbone.categories.${categoryId}`;
}

/**
 * P-42: the export/rasterize path (`FishboneDiagram`'s `language` prop) must
 * resolve labels against `project.meta.language` (D-43), never the editor's
 * live UI language — so it cannot go through `react-i18next`'s `t()`, which
 * always tracks the latter. Values transcribed verbatim from
 * `src/i18n/locales/{tr,en}/common.json`'s own `methods.fishbone.categories.*`
 * (D-188's own sourcing discipline — copy the shipped translation, don't
 * re-translate). The interactive Editor (no `language` prop) keeps using
 * `t()` as before, since there the UI language is exactly what should show.
 */
export const CATEGORY_EXPORT_LABELS: Readonly<Record<string, Readonly<Record<A3Language, string>>>> = {
  man: { tr: "İnsan", en: "Man" },
  machine: { tr: "Makine", en: "Machine" },
  material: { tr: "Malzeme", en: "Material" },
  method: { tr: "Metot", en: "Method" },
  measurement: { tr: "Ölçüm", en: "Measurement" },
  environment: { tr: "Çevre", en: "Environment" },
  management: { tr: "Yönetim", en: "Management" },
  price: { tr: "Fiyat", en: "Price" },
  product: { tr: "Ürün", en: "Product" },
  place: { tr: "Yer", en: "Place" },
  promotion: { tr: "Tutundurma", en: "Promotion" },
  people: { tr: "İnsanlar", en: "People" },
  process: { tr: "Süreç", en: "Process" },
  physicalEvidence: { tr: "Fiziksel Kanıt", en: "Physical Evidence" },
  productivity: { tr: "Verimlilik", en: "Productivity" },
};
