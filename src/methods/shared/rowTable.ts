/**
 * D-115: shared "row list" substrate — extracted up front (before a second
 * repetition) because at least five of Phase 6a's ten methods, and most of
 * the plain methods still to come, are a variable-length list of records
 * (VOC/complaint log, containment actions, stratification rows, tally
 * entries, SIPOC steps). Mirrors `whyChain.ts`'s shared-editor shape
 * (Phase 5), one layer more generic: `WhyStep` has one fixed field
 * (`answer`); a row table's fields are caller-configured via `columns`.
 *
 * Every field is a `string` — dates come from `<input type="date">` as an
 * ISO string, and fields that happen to hold a number (PPM, a tally count)
 * are recorded, never computed on, so there is nothing a numeric type would
 * buy a consuming method that D-51's loose-by-default `z.string()` doesn't
 * already give it. This keeps one editor and one line-formatter usable
 * across every row shape without per-field type branching.
 */

export type RowFieldType = "text" | "textarea" | "date" | "select";

export interface RowTableSelectOption {
  readonly value: string;
  readonly labelKey: string;
}

export interface RowTableColumn<TKey extends string> {
  readonly key: TKey;
  /** i18next key for the column's field label. */
  readonly labelKey: string;
  readonly type: RowFieldType;
  /** Required when `type` is `"select"`. */
  readonly options?: readonly RowTableSelectOption[];
}

/** A row-table row: a stable id plus one string field per configured column. */
export type RowTableRow<TKey extends string> = { readonly id: string } & Record<TKey, string>;

export function newRowTableRow<TKey extends string>(columns: readonly RowTableColumn<TKey>[]): RowTableRow<TKey> {
  const fields = Object.fromEntries(columns.map((column) => [column.key, ""])) as Record<TKey, string>;
  return { id: crypto.randomUUID(), ...fields };
}

/**
 * Default A3 rendering for a row table: one line per non-blank row, its
 * populated column values joined in configured order, blank rows dropped
 * entirely. A method with a more specific export shape (e.g. one column
 * bolded as a row title) writes its own formatter instead of using this one.
 */
export function rowTableLines<TKey extends string>(
  rows: readonly RowTableRow<TKey>[],
  columns: readonly RowTableColumn<TKey>[],
): readonly { readonly text: string }[] {
  return rows
    .map((row) =>
      columns
        .map((column) => row[column.key].trim())
        .filter((value) => value.length > 0)
        .join(" · "),
    )
    .filter((line) => line.length > 0)
    .map((text) => ({ text }));
}
