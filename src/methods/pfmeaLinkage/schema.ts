import { z } from "zod";

/**
 * SPEC.md §1.3 (Step 4): "PFMEA linkage (reference the failure mode, current
 * O/D ratings)".
 *
 * The word "reference" here is **not** `Entry.references[]`. A PFMEA is an
 * external controlled document, and `SPEC.md` §4.2 already gives external
 * records their own home: `meta.linkedRecords[]`, typed `'PFMEA'` among
 * others, at project level. D-116's entry-to-entry references address
 * entries; this method records a pointer into a document that lives outside
 * the project entirely, so it holds no `referenceRoles` and is a plain
 * fixed-field method.
 *
 * Ratings stay `string` per D-120 — an AIAG-VDA form records S/O/D as given
 * and nothing here recomputes an RPN. Loose per D-51.
 */
export const PfmeaLinkagePayloadSchema = z.looseObject({
  documentNo: z.string(),
  revision: z.string(),
  processStep: z.string(),
  failureMode: z.string(),
  effect: z.string(),
  severity: z.string(),
  occurrence: z.string(),
  detection: z.string(),
  currentControls: z.string(),
  note: z.string(),
});

export type PfmeaLinkagePayload = z.infer<typeof PfmeaLinkagePayloadSchema>;
