import { z } from "zod";
import { RoundSchema } from "./round";
import { STEP_IDS, StepIdSchema } from "./stepId";
import { StepStateSchema } from "./stepState";

const PersonSchema = z.looseObject({
  name: z.string(),
  email: z.string().optional(),
});

const LinkedRecordSchema = z.looseObject({
  type: z.enum(["8D", "NCR", "CAR", "PFMEA", "ControlPlan"]),
  ref: z.string(),
});

/** §8.11: shape owned by the AI/redaction layer (Phase 8+) — loose and near-empty until then. */
const RedactionPolicySchema = z.looseObject({});

const AiMetaSchema = z.looseObject({
  enabled: z.boolean(),
  providerId: z.enum(["anthropic", "openai", "google"]).optional(),
  modelId: z.string().optional(),
  redaction: RedactionPolicySchema,
});

const ProjectMetaSchema = z.looseObject({
  title: z.string(),
  projectCode: z.string(),
  revision: z.string(),
  partNumber: z.string().optional(),
  partName: z.string().optional(),
  customer: z.string().optional(),
  plant: z.string().optional(),
  department: z.string().optional(),
  line: z.string().optional(),
  owner: PersonSchema,
  team: z.array(PersonSchema),
  status: z.enum(["draft", "active", "on-hold", "closed"]),
  openedAt: z.iso.datetime(),
  closedAt: z.iso.datetime().optional(),
  language: z.enum(["tr", "en"]),
  linkedRecords: z.array(LinkedRecordSchema).optional(),
  ai: AiMetaSchema,
});

const SignOffEntrySchema = z.looseObject({
  name: z.string(),
  signedAt: z.iso.datetime(),
});

export type SignOffEntry = z.infer<typeof SignOffEntrySchema>;

/**
 * D-08: always 8 steps, one `StepState` per step id — never a projection onto
 * a template. Unlike the rest of this tree, `steps` does not need D-51's
 * loose/unknown-key handling: its key set is architecturally fixed (the
 * 8-step method is exactly what distinguishes this app from the 7-step form),
 * so a `record` keyed by the closed `StepId` union is both the right runtime
 * check (all 8 required, no others) and the cleaner inferred TS type.
 */
const StepsSchema = z.record(StepIdSchema, StepStateSchema);

/**
 * D-51: loose everywhere in this tree — an older build must never delete a
 * field it doesn't recognise when it re-saves a project written by a newer
 * one. `schemaVersion` (not the shape) is what a migration keys off.
 */
export const ProjectModelSchema = z.looseObject({
  id: z.string().min(1),
  schemaVersion: z.number().int().positive(),
  meta: ProjectMetaSchema,
  steps: StepsSchema,
  templateId: z.string(),
  signOff: z.looseObject({
    preparedBy: SignOffEntrySchema.optional(),
    reviewedBy: SignOffEntrySchema.optional(),
    approvedBy: SignOffEntrySchema.optional(),
  }),
  rounds: z.array(RoundSchema),
});

export type ProjectModel = z.infer<typeof ProjectModelSchema>;
export type Person = z.infer<typeof PersonSchema>;
export type SignOffState = ProjectModel["signOff"];

export { STEP_IDS };
