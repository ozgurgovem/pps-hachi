import type { RowTableColumn, RowTableSelectOption } from "../shared/rowTable";

export type CategoryBreakdownColumnKey = "category" | "subProblem" | "effect";

/**
 * Not named in `SPEC.md` §1.3 — added 2026-08-04 per Barış's request,
 * revisiting D-11's Step 2/Step 4 split without breaking it. D-11 keeps
 * Fishbone (a cause-hypothesis diagram) in Step 4; this is a Step 2
 * **stratification** tool that happens to share the same 4M/5M category
 * vocabulary while doing different cognitive work — sorting *observed*
 * sub-problems and their effects into categories, never asking "why".
 *
 * Deliberately independent of `fishbone/categories.ts`: no shared code, no
 * shared i18n keys, no `categorySet` flexibility. Fishbone's category-set
 * selector exists because its diagram layout needs a determinate spine to
 * draw; this method renders as plain grouped text, so there is no
 * structural reason to support more than the one set actually asked for.
 * Deliberately smaller than 4M/5M1E/6M/8P: Man/Machine/Material/Method/
 * Measurement is exactly the 5M breakdown described — YAGNI on the rest
 * until a real need for a different set shows up.
 */
export const CATEGORY_BREAKDOWN_CATEGORY_OPTIONS = [
  { value: "man", labelKey: "methods.categoryBreakdown.categories.man" },
  { value: "machine", labelKey: "methods.categoryBreakdown.categories.machine" },
  { value: "material", labelKey: "methods.categoryBreakdown.categories.material" },
  { value: "method", labelKey: "methods.categoryBreakdown.categories.method" },
  { value: "measurement", labelKey: "methods.categoryBreakdown.categories.measurement" },
] as const satisfies readonly RowTableSelectOption[];

export const CATEGORY_BREAKDOWN_COLUMNS = [
  { key: "category", labelKey: "methods.categoryBreakdown.columns.category", type: "select", options: CATEGORY_BREAKDOWN_CATEGORY_OPTIONS },
  { key: "subProblem", labelKey: "methods.categoryBreakdown.columns.subProblem", type: "textarea" },
  { key: "effect", labelKey: "methods.categoryBreakdown.columns.effect", type: "textarea" },
] as const satisfies readonly RowTableColumn<CategoryBreakdownColumnKey>[];
