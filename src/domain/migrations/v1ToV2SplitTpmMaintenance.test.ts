import { describe, expect, test } from "vitest";
import { v1ToV2SplitTpmMaintenance } from "./v1ToV2SplitTpmMaintenance";
import { runMigrations } from "./runMigrations";
import { ProjectModelSchema } from "../model/projectModel";

function tag(applies: boolean, severity: "low" | "medium" | "high" = "low") {
  return { applies, severity };
}

function oldTpmLossTaxonomyPayload() {
  return {
    workSafety: tag(false),
    cost: tag(true, "high"),
    productivity: tag(false),
    quality: tag(true, "medium"),
    maintenance: tag(true, "high"),
    humanResources: tag(false),
    environment: tag(false),
  };
}

describe("v1ToV2SplitTpmMaintenance", () => {
  test("copies the old maintenance tag into both autonomousMaintenance and professionalMaintenance", () => {
    const input = {
      steps: {
        "1": {
          entries: [{ id: "e1", methodId: "tpm-loss-taxonomy", payload: oldTpmLossTaxonomyPayload() }],
        },
      },
    };

    const result = v1ToV2SplitTpmMaintenance.migrate(input) as {
      steps: { "1": { entries: [{ payload: Record<string, unknown> }] } };
    };
    const payload = result.steps["1"].entries[0].payload;

    expect(payload.maintenance).toBeUndefined();
    expect(payload.autonomousMaintenance).toEqual(tag(true, "high"));
    expect(payload.professionalMaintenance).toEqual(tag(true, "high"));
    // Untouched categories survive unchanged.
    expect(payload.cost).toEqual(tag(true, "high"));
    expect(payload.quality).toEqual(tag(true, "medium"));
  });

  test("never touches an entry with a different methodId, even one with its own `maintenance` field", () => {
    const foreignPayload = { maintenance: "not a tpm loss tag at all", other: 1 };
    const input = {
      steps: {
        "1": {
          entries: [{ id: "e1", methodId: "some-other-method", payload: foreignPayload }],
        },
      },
    };

    const result = v1ToV2SplitTpmMaintenance.migrate(input) as {
      steps: { "1": { entries: [{ payload: unknown }] } };
    };

    expect(result.steps["1"].entries[0].payload).toEqual(foreignPayload);
  });

  test("leaves a tpm-loss-taxonomy payload with no maintenance field untouched (already-new-shape or malformed)", () => {
    const alreadyNewPayload = {
      workSafety: tag(false),
      autonomousMaintenance: tag(true, "low"),
      professionalMaintenance: tag(false),
    };
    const input = {
      steps: {
        "1": {
          entries: [{ id: "e1", methodId: "tpm-loss-taxonomy", payload: alreadyNewPayload }],
        },
      },
    };

    const result = v1ToV2SplitTpmMaintenance.migrate(input) as {
      steps: { "1": { entries: [{ payload: unknown }] } };
    };

    expect(result.steps["1"].entries[0].payload).toEqual(alreadyNewPayload);
  });

  test("leaves entries in other steps and non-tpm entries in the same step untouched", () => {
    const genericPayload = { text: "unrelated note" };
    const input = {
      steps: {
        "1": {
          entries: [
            { id: "e1", methodId: "tpm-loss-taxonomy", payload: oldTpmLossTaxonomyPayload() },
            { id: "e2", methodId: "generic-text", payload: genericPayload },
          ],
        },
        "2": {
          entries: [{ id: "e3", methodId: "generic-text", payload: genericPayload }],
        },
      },
    };

    const result = v1ToV2SplitTpmMaintenance.migrate(input) as {
      steps: {
        "1": { entries: [unknown, { payload: unknown }] };
        "2": { entries: [{ payload: unknown }] };
      };
    };

    expect(result.steps["1"].entries[1].payload).toEqual(genericPayload);
    expect(result.steps["2"].entries[0].payload).toEqual(genericPayload);
  });

  test("is defensive against a malformed/missing steps shape rather than throwing", () => {
    expect(v1ToV2SplitTpmMaintenance.migrate({ id: "p1" })).toEqual({ id: "p1" });
    expect(v1ToV2SplitTpmMaintenance.migrate(null)).toEqual(null);
    expect(v1ToV2SplitTpmMaintenance.migrate("not an object")).toEqual("not an object");
  });

  /**
   * D-59's own LOCKED promise, this migration's own real proof: an old,
   * fully-shaped schema-version-1 project — with a real
   * `tpm-loss-taxonomy` entry, still on the seven-category shape — must
   * still open. `runMigrations` (the real function `openProjectFlow.ts`
   * calls) walks it to the current schema version, and the result must
   * still parse as a valid `ProjectModel`.
   */
  test("a real old (schema version 1) project with a tpm-loss-taxonomy entry still opens after migrating to the current schema version", () => {
    const now = new Date().toISOString();
    const oldRawProject = {
      id: "p1",
      schemaVersion: 1,
      meta: {
        title: "Old project",
        projectCode: "PC-1",
        revision: "A",
        owner: { name: "Owner" },
        team: [],
        status: "active",
        openedAt: now,
        language: "tr",
        ai: { enabled: false, redaction: {} },
      },
      steps: {
        "1": {
          entries: [
            {
              id: "e1",
              methodId: "tpm-loss-taxonomy",
              title: "Loss taxonomy",
              order: 0,
              a3Visibility: "primary",
              payload: oldTpmLossTaxonomyPayload(),
              images: [],
              createdAt: now,
              updatedAt: now,
              provenance: { origin: "human" },
            },
          ],
        },
        "2": { entries: [] },
        "3": { entries: [] },
        "4": { entries: [] },
        "5": { entries: [] },
        "6": { entries: [] },
        "7": { entries: [] },
        "8": { entries: [] },
      },
      templateId: "farplas-7step-tr",
      signOff: {},
      rounds: [],
    };

    const migrated = runMigrations(oldRawProject, 1, 2);
    const result = ProjectModelSchema.safeParse(migrated);

    expect(result.success).toBe(true);
    if (result.success) {
      const payload = result.data.steps[1]?.entries[0]?.payload as Record<string, unknown>;
      expect(payload.autonomousMaintenance).toEqual(tag(true, "high"));
      expect(payload.professionalMaintenance).toEqual(tag(true, "high"));
    }
  });
});
