import { describe, expect, it } from "vitest";
import { sideEffectRiskAssessmentMethod } from ".";
import { SideEffectRiskAssessmentPayloadSchema } from "./schema";

describe("SideEffectRiskAssessmentPayloadSchema", () => {
  it("accepts the empty payload the plugin creates", () => {
    expect(
      SideEffectRiskAssessmentPayloadSchema.safeParse(sideEffectRiskAssessmentMethod.createEmptyPayload()).success,
    ).toBe(true);
  });
});

describe("sideEffectRiskAssessmentMethod", () => {
  it("declares a single-valued countermeasure role targeting its own step (Step 5)", () => {
    expect(sideEffectRiskAssessmentMethod.referenceRoles).toEqual([
      {
        role: "countermeasure",
        labelKey: "methods.sideEffectRiskAssessment.references.countermeasure.label",
        emptyKey: "methods.sideEffectRiskAssessment.references.countermeasure.empty",
        fromSteps: [5],
        multiple: false,
      },
    ]);
  });

  it("belongs to Step 5", () => {
    expect(sideEffectRiskAssessmentMethod.steps).toEqual([5]);
  });
});
