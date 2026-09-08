import type { ErasedMethodPlugin } from "../../../methods";

/**
 * W2/D-217 §2.1: the accordion layout needs exactly one entry editor open on
 * a step page at a time (create in `MethodBand` XOR edit in `EntriesBand`) —
 * the modal's "one thing at a time" discipline, carried over without a
 * modal. Owned by `StepPage` (one instance per step, reset on step change
 * via its own `key={stepId}`), passed down as a prop rather than duplicated
 * as separate local state in each band the way the old `EntryEditorPanel`
 * callers each held their own `activePlugin`/`editingEntryId`.
 */
export type ActiveEditor =
  | { readonly kind: "create"; readonly plugin: ErasedMethodPlugin }
  | { readonly kind: "edit"; readonly entryId: string };
