import { describe, expect, it } from "vitest";
import type { Entry, StepState } from "../../../domain/model";
import { getStepStatus } from "./stepStatus";

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

describe("getStepStatus", () => {
  it("is empty when the step has no entries", () => {
    const step: StepState = { entries: [] };
    expect(getStepStatus(step)).toBe("empty");
  });

  it("is inProgress when the step has at least one entry", () => {
    const step: StepState = { entries: [makeEntry()] };
    expect(getStepStatus(step)).toBe("inProgress");
  });
});
