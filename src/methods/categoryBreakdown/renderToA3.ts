import type { A3BlockContent, A3EntrySummary, A3TextLine } from "../../a3/methodContract";
import { CATEGORY_BREAKDOWN_CATEGORY_OPTIONS } from "./columns";
import type { CategoryBreakdownPayload, CategoryBreakdownRow } from "./schema";

/** A3-side labels — `renderToA3` is i18n-free (D-43), same as every other method. */
const CATEGORY_EXPORT_LABELS: Readonly<Record<string, string>> = {
  man: "Man",
  machine: "Machine",
  material: "Material",
  method: "Method",
  measurement: "Measurement",
};

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

    lines.push({ text: CATEGORY_EXPORT_LABELS[option.value] ?? option.value, bold: true });
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
    lines.push({ text: "Other" });
    lines.push(...unknownLines);
  }

  return { lines };
}
