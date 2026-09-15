import { z } from "zod";

/**
 * D-116: cross-step references are a first-class field on `Entry` —
 * `{ role, targetEntryId }[]` — not three named fields (`rootCauseIds`,
 * `pointOfCauseId`, `countermeasureId` as `SPEC.md` §4.2 sketches them) and
 * not anything inside `payload`. D-52 makes `payload` opaque at the model
 * level, so a reference buried in it would be invisible to every generic
 * consumer: orphan detection, Phase 7's traceability view, any
 * warn-before-delete would each need to know every method's payload shape.
 *
 * `role` is a **loose string**, not a `z.enum`. The constants below are
 * documented, not enforced, so a later method can introduce a new relation
 * without a schema migration — the same loose-by-default posture as D-51.
 *
 * `targetEntryId` points at an `Entry.id` anywhere in the project, including
 * the same step. It is never resolved at load time (D-117): a `.ppsx`
 * carrying a reference to a deleted entry must still open, and does.
 */
export const EntryReferenceSchema = z.looseObject({
  role: z.string(),
  targetEntryId: z.string(),
  /**
   * D-185/P-39: optionally narrows a reference to one node inside the
   * target entry's own tree-shaped payload (today only `whyWhyTree`'s
   * `nodes[]`, D-176) rather than the entry as a whole — a confirmed root
   * cause is one leaf, not the whole tree. Not named after `whyWhyTree`
   * specifically: a future tree-shaped payload could reuse it unchanged.
   * `undefined` (the default, and every reference before this field
   * existed) means the reference targets the entry as a whole — still a
   * fully valid choice, drilling down is never required (D-51's optional-
   * field-no-migration posture: every pre-existing `.ppsx` parses
   * unchanged). Points at a node's own `id`, never at its derived KN{N}
   * number (D-71: KN{N} is computed, never stored, so it cannot be a
   * stable address).
   */
  targetNodeId: z.string().optional(),
});

export type EntryReference = z.infer<typeof EntryReferenceSchema>;

/**
 * The three relations `SPEC.md` §4.2 names, as role constants. The role
 * names the *target's* kind, which is what makes a single list expressive
 * enough to replace three named fields:
 *
 * - `pointOfCause` — held by a root-cause entry, targets the Step 2 Point of
 *   Cause nomination it explains. (§4.2 "a root cause holds `pointOfCauseId`")
 * - `rootCause` — held by a countermeasure, targets the verified root cause
 *   it addresses. (§4.2 "a countermeasure holds `rootCauseIds[]`", §1.2 S5)
 * - `countermeasure` — held by an implementation action, targets the
 *   countermeasure it implements. (§4.2 "an action holds `countermeasureId`")
 *
 * `containment` is 6b's fourth constant: the ICA → PCA transition tracker
 * (§1.3 Step 6) links the interim containment action being retired to the
 * permanent countermeasure replacing it, and neither of the three above
 * names the interim side of that pair.
 *
 * **External** documents (PFMEA, Control Plan, 8D, NCR, CAR) are *not*
 * referenced this way — §4.2 gives them `meta.linkedRecords[]`, at project
 * level, because they are not entries. This is why the Step 4 PFMEA linkage
 * method holds no `references[]` despite §1.3 describing it with the word
 * "reference".
 */
export const REFERENCE_ROLES = {
  pointOfCause: "pointOfCause",
  rootCause: "rootCause",
  countermeasure: "countermeasure",
  containment: "containment",
} as const;

export type ReferenceRole = (typeof REFERENCE_ROLES)[keyof typeof REFERENCE_ROLES];
