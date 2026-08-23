import { describe, expect, it } from "vitest";
import type { Entry, StepState } from "../../../domain/model";
import type { ReadinessResult } from "../../../domain/readiness";
import { getStepStatus, isStepEmpty } from "./stepStatus";

const OK: ReadinessResult = { status: "ok", warnings: [] };
const FLAGGED: ReadinessResult = { status: "flagged", warnings: [{ rule: "S1", messageKey: "workspace.readiness.s1" }] };

function makeEntry(): Entry {
  return {
    id: "e1",
    methodId: "generic-text",
    title: "x",
    order: 0,
    a3Visibility: "primary",
    payload: {},
    images: [],
    createdAt: "2026-08-02T00:00:00.000Z",
    updatedAt: "2026-08-02T00:00:00.000Z",
    provenance: { origin: "human" },
  };
}

describe("isStepEmpty", () => {
  it("is true when the step has no entries", () => {
    expect(isStepEmpty({ entries: [] })).toBe(true);
  });

  it("is false when the step has at least one entry", () => {
    expect(isStepEmpty({ entries: [makeEntry()] })).toBe(false);
  });
});

describe("getStepStatus", () => {
  it("is empty when the step has no entries, regardless of readiness", () => {
    const step: StepState = { entries: [] };
    expect(getStepStatus(step, FLAGGED)).toBe("empty");
    expect(getStepStatus(step, OK)).toBe("empty");
  });

  it("is complete when the step has entries and readiness found nothing to flag", () => {
    const step: StepState = { entries: [makeEntry()] };
    expect(getStepStatus(step, OK)).toBe("complete");
  });

  it("is flagged when the step has entries and readiness reports a warning", () => {
    const step: StepState = { entries: [makeEntry()] };
    expect(getStepStatus(step, FLAGGED)).toBe("flagged");
  });
});
