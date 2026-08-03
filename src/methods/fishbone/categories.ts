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
