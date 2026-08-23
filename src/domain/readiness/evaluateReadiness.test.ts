import { describe, expect, it } from "vitest";
import { createNewProject } from "../model/createProject";
import type { Entry, ProjectModel, StepId } from "../model";
import { evaluateReadiness } from "./evaluateReadiness";

function entry(id: string, methodId: string, payload: unknown, overrides: Partial<Entry> = {}): Entry {
  return {
    id,
    methodId,
    title: `Entry ${id}`,
    order: 0,
    a3Visibility: "primary",
    payload,
    images: [],
    createdAt: "2026-08-19T00:00:00.000Z",
    updatedAt: "2026-08-19T00:00:00.000Z",
    provenance: { origin: "human" },
    ...overrides,
  };
}

function projectWith(entriesByStep: Partial<Record<StepId, readonly Entry[]>>): ProjectModel {
  const { project } = createNewProject({ title: "T", language: "tr", appVersion: "0.0.0" });
  const steps = { ...project.steps };
  for (const [stepId, entries] of Object.entries(entriesByStep)) {
    const key = Number(stepId) as StepId;
    steps[key] = { ...steps[key], entries: entries.map((e, index) => ({ ...e, order: index })) };
  }
  return { ...project, steps };
}

describe("evaluateReadiness", () => {
  it("marks every step ok with no warnings on a brand-new project", () => {
    const { project } = createNewProject({ title: "T", language: "tr", appVersion: "0.0.0" });
    const readiness = evaluateReadiness(project);
    for (const stepId of [1, 2, 3, 4, 5, 6, 7, 8] as const) {
      expect(readiness[stepId]).toEqual({ status: "ok", warnings: [] });
    }
  });

  it("never flags a step with zero entries, even when a rule would otherwise fire on absence", () => {
    // S2 literally reads "at least one data-based entry must exist" — an
    // untouched Step 2 must still read "empty", not "flagged".
    const project = projectWith({});
    expect(evaluateReadiness(project)[2]).toEqual({ status: "ok", warnings: [] });
  });

  describe("S1 — gap quantification", () => {
    it("flags when no gap-statement entry quantifies the gap", () => {
      const project = projectWith({ 1: [entry("e1", "five-w2h", {})] });
      const readiness = evaluateReadiness(project)[1];
      expect(readiness.status).toBe("flagged");
      expect(readiness.warnings).toEqual([{ rule: "S1", messageKey: "workspace.readiness.s1" }]);
    });

    it("flags a gap-statement entry left at its default (gapValue 0)", () => {
      const project = projectWith({
        1: [entry("e1", "gap-statement", { ideal: "", actual: "", gap: "", gapValue: 0, unit: "", baselinePeriod: "" })],
      });
      expect(evaluateReadiness(project)[1].status).toBe("flagged");
    });

    it("passes once gapValue/unit/baselinePeriod are all filled", () => {
      const project = projectWith({
        1: [
          entry("e1", "gap-statement", {
            ideal: "",
            actual: "",
            gap: "",
            gapValue: 4.2,
            unit: "%",
            baselinePeriod: "Q2 2026",
          }),
        ],
      });
      expect(evaluateReadiness(project)[1]).toEqual({ status: "ok", warnings: [] });
    });
  });

  describe("S2 — data-based entry + point of cause", () => {
    it("flags both conditions when the step is opinion-only", () => {
      const project = projectWith({ 2: [entry("e1", "generic-text", {})] });
      const readiness = evaluateReadiness(project)[2];
      expect(readiness.status).toBe("flagged");
      expect(readiness.warnings).toEqual([
        { rule: "S2", messageKey: "workspace.readiness.s2NoDataEntry" },
        { rule: "S2", messageKey: "workspace.readiness.s2NoPointOfCause" },
      ]);
    });

    it("flags only the missing point-of-cause once a data-based entry exists", () => {
      const project = projectWith({ 2: [entry("e1", "pareto", {})] });
      const readiness = evaluateReadiness(project)[2];
      expect(readiness.warnings).toEqual([{ rule: "S2", messageKey: "workspace.readiness.s2NoPointOfCause" }]);
    });

    it("passes with a data-based entry and a point-of-cause entry", () => {
      const project = projectWith({ 2: [entry("e1", "trend", {}), entry("e2", "point-of-cause", {})] });
      expect(evaluateReadiness(project)[2]).toEqual({ status: "ok", warnings: [] });
    });
  });

  describe("S3 — SMART target completeness", () => {
    function smartPayload(overrides: Record<string, unknown> = {}) {
      return {
        metric: "Defect rate",
        baseline: 5,
        target: 1,
        unit: "%",
        dueDate: "2026-12-01",
        owner: "",
        prioritizedItems: [],
        stakeholderNote: "",
        ...overrides,
      };
    }

    it("flags when no smart-target entry exists", () => {
      const project = projectWith({ 3: [entry("e1", "generic-text", {})] });
      expect(evaluateReadiness(project)[3].status).toBe("flagged");
    });

    it("flags an incomplete smart-target entry", () => {
      const project = projectWith({ 3: [entry("e1", "smart-target", smartPayload({ unit: "" }))] });
      const readiness = evaluateReadiness(project)[3];
      expect(readiness.warnings).toEqual([{ rule: "S3", messageKey: "workspace.readiness.s3" }]);
    });

    it("passes a fully-filled smart-target entry", () => {
      const project = projectWith({ 3: [entry("e1", "smart-target", smartPayload())] });
      expect(evaluateReadiness(project)[3]).toEqual({ status: "ok", warnings: [] });
    });
  });

  describe("S4 — verified root cause", () => {
    it("flags when nothing is confirmed", () => {
      const project = projectWith({
        4: [entry("e1", "hypothesis-verification", { rows: [{ verdict: "rejected" }] })],
      });
      expect(evaluateReadiness(project)[4].warnings).toEqual([
        { rule: "S4", messageKey: "workspace.readiness.s4" },
      ]);
    });

    it("passes via a confirmed hypothesis-verification row", () => {
      const project = projectWith({
        4: [entry("e1", "hypothesis-verification", { rows: [{ verdict: "confirmed" }] })],
      });
      expect(evaluateReadiness(project)[4]).toEqual({ status: "ok", warnings: [] });
    });

    it("passes via a confirmedRootCause why-why node", () => {
      const project = projectWith({
        4: [entry("e1", "why-why-tree", { nodes: [{ id: "n1", parentId: null, outcome: "confirmedRootCause" }] })],
      });
      expect(evaluateReadiness(project)[4]).toEqual({ status: "ok", warnings: [] });
    });
  });

  describe("S5 — countermeasure linkage + hierarchy justification", () => {
    it("flags a countermeasure with no rootCause reference", () => {
      const project = projectWith({ 5: [entry("cm1", "countermeasure", {})] });
      expect(evaluateReadiness(project)[5].warnings).toEqual([
        { rule: "S5", messageKey: "workspace.readiness.s5NoVerifiedRootCause" },
      ]);
    });

    it("passes a countermeasure holding a rootCause reference with no hierarchy entry", () => {
      const project = projectWith({
        5: [entry("cm1", "countermeasure", {}, { references: [{ role: "rootCause", targetEntryId: "rc1" }] })],
      });
      expect(evaluateReadiness(project)[5]).toEqual({ status: "ok", warnings: [] });
    });

    it("flags an unjustified weakest-level hierarchy entry linked to the countermeasure", () => {
      const project = projectWith({
        5: [
          entry("cm1", "countermeasure", {}, { references: [{ role: "rootCause", targetEntryId: "rc1" }] }),
          entry(
            "h1",
            "error-proofing-hierarchy",
            { level: "procedure", note: "" },
            { references: [{ role: "countermeasure", targetEntryId: "cm1" }] },
          ),
        ],
      });
      expect(evaluateReadiness(project)[5].warnings).toEqual([
        { rule: "S5", messageKey: "workspace.readiness.s5UnjustifiedHierarchy" },
      ]);
    });

    it("passes a weakest-level hierarchy entry that documents a reason", () => {
      const project = projectWith({
        5: [
          entry("cm1", "countermeasure", {}, { references: [{ role: "rootCause", targetEntryId: "rc1" }] }),
          entry(
            "h1",
            "error-proofing-hierarchy",
            { level: "procedure", note: "No poka-yoke feasible on legacy line" },
            { references: [{ role: "countermeasure", targetEntryId: "cm1" }] },
          ),
        ],
      });
      expect(evaluateReadiness(project)[5]).toEqual({ status: "ok", warnings: [] });
    });
  });

  describe("S6 — action owner/due date", () => {
    it("flags an action item missing owner or due date", () => {
      const project = projectWith({ 6: [entry("e1", "action-item", { owner: "", dueDate: "2026-09-01" })] });
      expect(evaluateReadiness(project)[6].warnings).toEqual([
        { rule: "S6", messageKey: "workspace.readiness.s6" },
      ]);
    });

    it("passes when every action item has both", () => {
      const project = projectWith({
        6: [entry("e1", "action-item", { owner: "Ayşe", dueDate: "2026-09-01" })],
      });
      expect(evaluateReadiness(project)[6]).toEqual({ status: "ok", warnings: [] });
    });
  });

  describe("S7 — process confirmation after a recorded verdict", () => {
    it("does not flag when no verdict has been recorded yet", () => {
      const project = projectWith({ 7: [entry("e1", "result-verdict", { verdict: "pending", notes: "" })] });
      expect(evaluateReadiness(project)[7]).toEqual({ status: "ok", warnings: [] });
    });

    it("flags a recorded verdict with an empty sustainment audit", () => {
      const project = projectWith({
        7: [
          entry("e1", "result-verdict", { verdict: "met", notes: "" }),
          entry("e2", "sustainment-audit", { rows: [] }),
        ],
      });
      expect(evaluateReadiness(project)[7].warnings).toEqual([
        { rule: "S7", messageKey: "workspace.readiness.s7" },
      ]);
    });

    it("passes a recorded verdict with at least one audit row", () => {
      const project = projectWith({
        7: [
          entry("e1", "result-verdict", { verdict: "notMet", notes: "" }),
          entry("e2", "sustainment-audit", { rows: [{ id: "r1" }] }),
        ],
      });
      expect(evaluateReadiness(project)[7]).toEqual({ status: "ok", warnings: [] });
    });
  });

  describe("S8 — document updates + yokoten", () => {
    it("flags when no document is marked complete and yokoten is empty", () => {
      const project = projectWith({
        8: [
          entry("e1", "document-updates-tracker", {
            pfmea: { status: "inProgress" },
            controlPlan: { status: "notStarted" },
          }),
        ],
      });
      const readiness = evaluateReadiness(project)[8];
      expect(readiness.warnings).toEqual([
        { rule: "S8", messageKey: "workspace.readiness.s8NoDocumentUpdated" },
        { rule: "S8", messageKey: "workspace.readiness.s8YokotenEmpty" },
      ]);
    });

    it("passes once a document type is complete and yokoten has a row", () => {
      const project = projectWith({
        8: [
          entry("e1", "document-updates-tracker", { pfmea: { status: "complete" } }),
          entry("e2", "yokoten-tracker", { rows: [{ id: "r1" }] }),
        ],
      });
      expect(evaluateReadiness(project)[8]).toEqual({ status: "ok", warnings: [] });
    });
  });
});
