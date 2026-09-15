import type { Migration } from "./types";

/**
 * D-267/P-66: schema version 1 → 2. `tpmLossTaxonomy`'s fixed loss-category
 * list grew from seven to eight — `TEMPLATE_ANALYSIS.md` §9.6 found the
 * real `PPS_A3_Format_TR.xls` (the form `farplas-7step-tr` claims
 * byte-fidelity to) splits Maintenance into `autonomousMaintenance` and
 * `professionalMaintenance`. This migration only ever touches an entry
 * whose `methodId` is literally `"tpm-loss-taxonomy"` — every other one of
 * the registry's other methods' payloads (including any unrelated field
 * that happens to be named `maintenance`) is left completely untouched.
 *
 * Barış's own choice (`AskUserQuestion`, `P66-tpmLossTaxonomy-8-kategori-
 * migration.md` §1): an old entry's `maintenance` tag is copied into BOTH
 * new fields, never silently discarded and never silently guessed into
 * just one. A project exported right after migrating shows two rows where
 * it used to show one — a visible-but-wrong duplication the user can
 * correct on review, not an invisible data loss (D-100/D-190's own
 * precedent for this exact trade-off).
 *
 * `types.ts`'s own instruction: a migration takes/returns `unknown` and
 * embeds a frozen copy of whatever shape it depends on, rather than
 * importing the live `ProjectModel`/`tpmLossTaxonomy` schemas — those can
 * keep changing after this migration ships, and this step must keep
 * meaning exactly what it meant the day it was written.
 */
const TPM_LOSS_TAXONOMY_METHOD_ID = "tpm-loss-taxonomy";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function migrateTpmLossTaxonomyPayload(payload: unknown): unknown {
  if (!isPlainObject(payload) || !("maintenance" in payload)) {
    return payload;
  }
  const { maintenance, ...rest } = payload;
  return {
    ...rest,
    autonomousMaintenance: maintenance,
    professionalMaintenance: maintenance,
  };
}

function migrateEntry(entry: unknown): unknown {
  if (!isPlainObject(entry) || entry["methodId"] !== TPM_LOSS_TAXONOMY_METHOD_ID) {
    return entry;
  }
  return { ...entry, payload: migrateTpmLossTaxonomyPayload(entry["payload"]) };
}

function migrateStepState(stepState: unknown): unknown {
  if (!isPlainObject(stepState) || !Array.isArray(stepState["entries"])) {
    return stepState;
  }
  return { ...stepState, entries: stepState["entries"].map(migrateEntry) };
}

function migrateProject(input: unknown): unknown {
  if (!isPlainObject(input) || !isPlainObject(input["steps"])) {
    return input;
  }
  const steps = input["steps"] as Record<string, unknown>;
  const migratedSteps: Record<string, unknown> = {};
  for (const [stepId, stepState] of Object.entries(steps)) {
    migratedSteps[stepId] = migrateStepState(stepState);
  }
  return { ...input, steps: migratedSteps };
}

export const v1ToV2SplitTpmMaintenance: Migration = {
  fromVersion: 1,
  toVersion: 2,
  migrate: migrateProject,
};
