import type { A3BlockContent, A3EntrySummary, A3Language, A3TextLine } from "../../a3/methodContract";
import { resolveA3Language } from "../../a3/methodContract";
import { CATEGORY_BREAKDOWN_CATEGORY_OPTIONS } from "./columns";
import type { CategoryBreakdownPayload, CategoryBreakdownRow } from "./schema";

/** A3-side labels, keyed by `A3Language` (D-188/P-26) — `renderToA3` is i18n-free (D-43), same as every other method. */
const CATEGORY_EXPORT_LABELS: Readonly<Record<string, Readonly<Record<A3Language, string>>>> = {
  man: { tr: "İnsan", en: "Man" },
  machine: { tr: "Makine", en: "Machine" },
  material: { tr: "Malzeme", en: "Material" },
  method: { tr: "Metot", en: "Method" },
  measurement: { tr: "Ölçüm", en: "Measurement" },
};

/** Fallback heading for a row whose category matches none of the 5M options (D-100's never-truncate guarantee). */
const OTHER_LABEL: Readonly<Record<A3Language, string>> = { tr: "Diğer", en: "Other" };

function rowLine(row: CategoryBreakdownRow): A3TextLine | undefined {
  const parts = [row.subProblem, row.effect].map((value) => value.trim()).filter((value) => value.length > 0);
  return parts.length > 0 ? { text: `  ${parts.join(" — ")}` } : undefined;
}

/**
 * Grouped by category, not row order — the whole point of a stratification
 * checklist is seeing what fell under each heading at a glance. Categories
 * with no populated row are omitted rather than printed empty.
 */
export function renderCategoryBreakdownToA3(
  payload: CategoryBreakdownPayload,
  entry: A3EntrySummary,
): A3BlockContent {
  const language = resolveA3Language(entry);
  const lines: A3TextLine[] = [{ text: entry.title, bold: true }];
  const knownCategories = new Set<string>(CATEGORY_BREAKDOWN_CATEGORY_OPTIONS.map((option) => option.value));

  for (const option of CATEGORY_BREAKDOWN_CATEGORY_OPTIONS) {
    const rowLines = payload.rows
      .filter((row) => row.category === option.value)
      .map(rowLine)
      .filter((line): line is A3TextLine => line !== undefined);

    if (rowLines.length === 0) {
      continue;
    }

    lines.push({ text: CATEGORY_EXPORT_LABELS[option.value]?.[language] ?? option.value, bold: true });
    lines.push(...rowLines);
  }

  /*
   * A row whose `category` matches none of the five known values (a blank
   * default on a brand-new row, or a value from a future build) must not
   * silently vanish from the export — D-100's never-truncate guarantee,
   * applied one layer over.
   */
  const unknownLines = payload.rows
    .filter((row) => !knownCategories.has(row.category))
    .map(rowLine)
    .filter((line): line is A3TextLine => line !== undefined);

  if (unknownLines.length > 0) {
    lines.push({ text: OTHER_LABEL[language] });
    lines.push(...unknownLines);
  }

  return { lines };
}
