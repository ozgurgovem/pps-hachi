import type { FieldFormField } from "../shared/fieldForm";

/**
 * A hand-written literal union, not `keyof FiveW2HPayload` — `z.looseObject`
 * gives the inferred payload type a `[x: string]: unknown` index signature
 * (D-51), and `keyof` over a type with a string index signature widens to
 * plain `string` rather than the specific field names, which silently
 * breaks `FieldFormValues<TKey>`'s assignability everywhere downstream
 * (caught by `tsc --noEmit`, not `vitest` — this project's own repeated
 * lesson that vitest does not type-check). Matches every other
 * `FieldFormField`-based method's own `fields.ts` (`pointOfCause`,
 * `icaPcaTransition`, …).
 */
export type FiveW2HFieldKey = "what" | "where" | "when" | "who" | "which" | "how" | "howMuch";

/**
 * P-23: migrated onto D-127's `FieldFormEditor` substrate — mechanical, the
 * editor's own rendered fields/labels/behavior are unchanged (still one
 * `Textarea` per dimension, same `methods.fiveW2H.fields.*` i18n keys).
 * `exportLabel` mirrors `renderToA3.ts`'s own (untouched) `FIELD_ORDER`
 * dictionary — kept here too so a future consolidation has a ready source,
 * but `renderFiveW2HToA3` still reads its own copy rather than this one,
 * since re-pointing it is outside this cleanup's scope.
 */
export const FIVE_W2H_FIELDS = [
  {
    key: "what",
    labelKey: "methods.fiveW2H.fields.what",
    exportLabel: { tr: "Ne", en: "What" },
    type: "textarea",
  },
  {
    key: "where",
    labelKey: "methods.fiveW2H.fields.where",
    exportLabel: { tr: "Nerede", en: "Where" },
    type: "textarea",
  },
  {
    key: "when",
    labelKey: "methods.fiveW2H.fields.when",
    exportLabel: { tr: "Ne zaman", en: "When" },
    type: "textarea",
  },
  {
    key: "who",
    labelKey: "methods.fiveW2H.fields.who",
    exportLabel: { tr: "Kim", en: "Who" },
    type: "textarea",
  },
  {
    key: "which",
    labelKey: "methods.fiveW2H.fields.which",
    exportLabel: { tr: "Hangisi", en: "Which" },
    type: "textarea",
  },
  {
    key: "how",
    labelKey: "methods.fiveW2H.fields.how",
    exportLabel: { tr: "Nasıl", en: "How" },
    type: "textarea",
  },
  {
    key: "howMuch",
    labelKey: "methods.fiveW2H.fields.howMuch",
    exportLabel: { tr: "Ne kadar", en: "How much" },
    type: "textarea",
  },
] as const satisfies readonly FieldFormField<FiveW2HFieldKey>[];
