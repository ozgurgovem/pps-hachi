import { z } from "zod";
import { MSA_GAGE_RR_VERDICTS } from "./verdicts";

/**
 * SPEC.md §1.3 (Step 2): measurement system sanity check — is the data
 * trustworthy? A single MSA/Gage R&R assessment record (multiple
 * assessments are multiple entries, per the app's existing multi-entry
 * model — not a row list here). Loose per D-51.
 */
export const MsaGageRrPayloadSchema = z.looseObject({
  method: z.string(),
  evaluator: z.string(),
  date: z.string(),
  percentGrr: z.string(),
  verdict: z.enum(MSA_GAGE_RR_VERDICTS),
  note: z.string(),
});

export type MsaGageRrPayload = z.infer<typeof MsaGageRrPayloadSchema>;
