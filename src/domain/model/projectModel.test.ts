import { describe, expect, test } from "vitest";
import { ProjectModelSchema } from "./projectModel";
import { createNewProject } from "./createProject";

function validProject() {
  const { project } = createNewProject({ title: "Şişli Hattı Arıza Analizi", language: "tr", appVersion: "0.1.0" });
  return project;
}

describe("ProjectModelSchema", () => {
  test("parses a freshly-created project", () => {
    const result = ProjectModelSchema.safeParse(validProject());
    expect(result.success).toBe(true);
  });

  test("has an entries array for all 8 steps, each empty", () => {
    const parsed = ProjectModelSchema.parse(validProject());
    for (let step = 1; step <= 8; step += 1) {
      expect(parsed.steps[step as keyof typeof parsed.steps].entries).toEqual([]);
    }
  });

  // D-51: a field only a newer build understands must survive a parse by an
  // older one untouched — never silently stripped.
  test("preserves an unrecognised top-level field instead of stripping it", () => {
    const input = { ...validProject(), futurePhaseField: { anything: "goes here" } };

    const parsed = ProjectModelSchema.parse(input);

    expect(parsed).toMatchObject({ futurePhaseField: { anything: "goes here" } });
  });

  test("preserves an unrecognised field nested inside meta", () => {
    const base = validProject();
    const input = { ...base, meta: { ...base.meta, futureMetaField: "kept" } };

    const parsed = ProjectModelSchema.parse(input);

    expect(parsed.meta).toMatchObject({ futureMetaField: "kept" });
  });

  test("preserves an unrecognised field nested inside an entry", () => {
    const base = validProject();
    const entry = {
      id: "e1",
      methodId: "pareto",
      title: "Pareto of defects",
      order: 0,
      a3Visibility: "primary",
      payload: { bars: [] },
      images: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      provenance: { origin: "human" },
      futureEntryField: "kept",
    };
    const input = {
      ...base,
      steps: { ...base.steps, 2: { entries: [entry] } },
    };

    const parsed = ProjectModelSchema.parse(input);

    expect(parsed.steps[2].entries[0]).toMatchObject({ futureEntryField: "kept" });
  });

  // D-52: payload is opaque at this level — an unknown methodId's payload
  // must round-trip exactly, whatever shape it happens to have.
  test("round-trips an entry with an unknown methodId's payload untouched", () => {
    const base = validProject();
    const weirdPayload = { nested: { arbitrary: [1, 2, 3] }, note: "not a registered method" };
    const entry = {
      id: "e1",
      methodId: "some-future-method-this-build-has-never-heard-of",
      title: "Unknown",
      order: 0,
      a3Visibility: "hidden",
      payload: weirdPayload,
      images: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      provenance: { origin: "human" },
    };
    const input = { ...base, steps: { ...base.steps, 5: { entries: [entry] } } };

    const parsed = ProjectModelSchema.parse(input);

    expect(parsed.steps[5].entries[0]?.payload).toEqual(weirdPayload);
  });

  // D-58: Round is metadata only; entries carry roundId, not the reverse.
  test("accepts a Round with metadata fields only, and an entry referencing it by roundId", () => {
    const base = validProject();
    const entry = {
      id: "e1",
      methodId: "five-why-3leg",
      title: "Round 2 root cause",
      order: 0,
      a3Visibility: "primary",
      payload: {},
      images: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      provenance: { origin: "human" },
      roundId: "round-2",
    };
    const input = {
      ...base,
      steps: { ...base.steps, 4: { entries: [entry] } },
      rounds: [{ id: "round-2", openedAt: new Date().toISOString(), reason: "containment failed" }],
    };

    const parsed = ProjectModelSchema.parse(input);

    expect(parsed.rounds[0]).not.toHaveProperty("entries");
    expect(parsed.steps[4].entries[0]?.roundId).toBe("round-2");
  });

  // D-53: readiness must never be required by (or persisted through) this schema.
  test("parses a StepState with no readiness field at all", () => {
    const base = validProject();
    const input = { ...base, steps: { ...base.steps, 3: { entries: [] } } };

    const result = ProjectModelSchema.safeParse(input);

    expect(result.success).toBe(true);
  });

  test("rejects a project missing a required field", () => {
    const withoutId: Record<string, unknown> = { ...validProject() };
    delete withoutId.id;

    const result = ProjectModelSchema.safeParse(withoutId);

    expect(result.success).toBe(false);
  });

  // J2/D-205: RedactionPolicySchema gained real optional fields — a pre-J2
  // `redaction: {}` project (every fixture written before this dilim) must
  // still parse unchanged.
  describe("RedactionPolicySchema (J2/D-205)", () => {
    test("still accepts an empty redaction object, unset fields and all", () => {
      const base = validProject();
      const input = { ...base, meta: { ...base.meta, ai: { ...base.meta.ai, redaction: {} } } };

      const result = ProjectModelSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    test("accepts a real customers-mode redaction policy", () => {
      const base = validProject();
      const input = {
        ...base,
        meta: {
          ...base.meta,
          ai: { ...base.meta.ai, redaction: { mode: "customers", terms: ["Acme Corp"], preserveNumbers: true } },
        },
      };

      const parsed = ProjectModelSchema.parse(input);

      expect(parsed.meta.ai.redaction).toEqual({ mode: "customers", terms: ["Acme Corp"], preserveNumbers: true });
    });

    test("rejects a mode outside the off/customers enum", () => {
      const base = validProject();
      const input = { ...base, meta: { ...base.meta, ai: { ...base.meta.ai, redaction: { mode: "custom" } } } };

      const result = ProjectModelSchema.safeParse(input);

      expect(result.success).toBe(false);
    });
  });
});
