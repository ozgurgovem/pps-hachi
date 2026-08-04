import type { RowFieldType, RowTableSelectOption } from "./rowTable";

/**
 * Shared "one record, fixed fields" substrate — the single-record sibling of
 * D-115's `rowTable.ts`. Five of Phase 6b's ten methods are one labelled
 * record (Point of Cause nomination, PFMEA linkage, countermeasure, action
 * item, ICA→PCA transition), which is the repetition D-115's own rule says to
 * abstract on sight.
 *
 * Reuses `RowFieldType`/`RowTableSelectOption` rather than restating them:
 * "a labelled field of one of four kinds" is the same concept the row table
 * already owns per column, and two spellings of it would drift.
 *
 * Deliberately **not** retrofitted onto Phase 6a's four hand-rolled
 * fixed-field editors (Gap Statement, 5W2H, problem-type classifier, MSA) —
 * those already ship and work, and rewriting them is a change to 6a's code
 * outside 6b's scope. Flagged as a cheap follow-up, not silently left.
 */
export interface FieldFormField<TKey extends string> {
  readonly key: TKey;
  /** i18next key for the field's label in the editor. */
  readonly labelKey: string;
  /**
   * Label used on the A3 sheet. `src/a3` and every `renderToA3` are
   * i18n-free (D-43 purity boundary), so the export label is authored here
   * beside the field rather than resolved through i18next at render time.
   */
  readonly exportLabel: string;
  readonly type: RowFieldType;
  /** Required when `type` is `"select"`. */
  readonly options?: readonly RowTableSelectOption[];
  /** Renders across the full width instead of sharing the two-column grid. */
  readonly wide?: boolean;
}

export type FieldFormValues<TKey extends string> = Record<TKey, string>;

export function emptyFieldFormValues<TKey extends string>(
  fields: readonly FieldFormField<TKey>[],
): FieldFormValues<TKey> {
  return Object.fromEntries(
    fields.map((field) => [field.key, field.type === "select" ? (field.options?.[0]?.value ?? "") : ""]),
  ) as FieldFormValues<TKey>;
}

/**
 * Default A3 rendering: one `Label: value` line per populated field, in
 * declared order, blank fields dropped. A select renders the raw stored
 * value — a method wanting a prettier export label for an option writes its
 * own formatter, the same escape hatch `rowTableLines` documents.
 */
export function fieldFormLines<TKey extends string>(
  values: FieldFormValues<TKey>,
  fields: readonly FieldFormField<TKey>[],
): readonly { readonly text: string }[] {
  return fields
    .map((field) => ({ field, value: (values[field.key] ?? "").trim() }))
    .filter(({ value }) => value.length > 0)
    .map(({ field, value }) => ({ text: `${field.exportLabel}: ${value}` }));
}
