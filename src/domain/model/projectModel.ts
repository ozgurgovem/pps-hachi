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

/**
 * §8.11/D-205 (Faz 9 J2): every field optional so a pre-J2 `redaction: {}`
 * literal (every fixture and test written before this dilim) keeps parsing
 * unchanged (D-51/D-128's additive posture) — `resolveRedactionPolicy`
 * (`src/ai/redaction.ts`) is where an absent field actually becomes a
 * default, the same "optional schema field + resolve helper" split
 * `language?`/`resolveA3Language` and `images?`/`resolveA3Images`
 * (`src/a3/methodContract.ts`) already established. `"customers-and-parts"`/
 * `"custom"` are real modes in SPEC's own draft type but narrowed out of
 * this dilim's scope (D-203/§2.2) — adding one later is additive.
 * `preserveNumbers` is a fixed `true` literal, never actually configurable.
 */
const RedactionModeSchema = z.enum(["off", "customers"]);
const RedactionPolicySchema = z.looseObject({
  mode: RedactionModeSchema.optional(),
  terms: z.array(z.string()).optional(),
  preserveNumbers: z.literal(true).optional(),
});

/** D-199/D-200: single provider (Farplas's own Vorion gateway) — supersedes
 * the original three-provider draft. D-52's loose/additive posture means no
 * migration is needed for this narrowing; no project has ever set this to
 * anything but `undefined` (no Settings UI existed before Faz 8). */
const AiMetaSchema = z.looseObject({
  enabled: z.boolean(),
  providerId: z.enum(["vorion"]).optional(),
  modelId: z.string().optional(),
  redaction: RedactionPolicySchema,
});

/**
 * Faz 11/L1 (D-223's own direct decision, §13.2/D-153/D-165): the header
 * identity band's three fields with no home in `ProjectMetaSchema` before
 * this dilim. Additive/optional throughout, D-51's loose-schema posture —
 * no migration, every pre-L1 project (with none of these set) still parses.
 * `priority` stays a plain string (not `z.enum`) matching this codebase's
 * own established posture for status-like fields (`countermeasure.status`,
 * `kpiStrip`'s `status`, etc.) — the UI constrains it to §13.2's own
 * Critical/High/Medium/Low dictionary (`src/domain/model/projectPriority.ts`),
 * the schema itself stays permissive. `generalRag` is the one true enum
 * here — it is always manually set (never computed, the same discipline
 * `costApproval`/`kpiStrip.status` already established), and D-165 already
 * named its three values (Red/Amber/Green) exactly.
 */
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
  priority: z.string().optional(),
  targetClosureDate: z.string().optional(),
  generalRag: z.enum(["red", "amber", "green"]).optional(),
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
/** D-201: `meta.ai` in isolation — `MetaAiSetCommand`'s `before`/`after` shape. */
export type AiMeta = ProjectModel["meta"]["ai"];
/** D-224 (Faz 11/L1): the header identity band's three new fields, in isolation — `MetaProjectInfoSetCommand`'s `before`/`after` shape, same posture as `AiMeta`. */
export type ProjectInfoFields = Pick<ProjectModel["meta"], "priority" | "targetClosureDate" | "generalRag">;
export type GeneralRag = NonNullable<ProjectModel["meta"]["generalRag"]>;
export type RedactionMode = z.infer<typeof RedactionModeSchema>;
export type RedactionPolicy = z.infer<typeof RedactionPolicySchema>;
export type SignOffState = ProjectModel["signOff"];

export { STEP_IDS };
