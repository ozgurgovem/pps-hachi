import { describe, expect, it } from "vitest";
import { hypothesisVerificationMethod } from ".";
import { HypothesisVerificationPayloadSchema } from "./schema";

describe("HypothesisVerificationPayloadSchema", () => {
  it("accepts the empty payload the plugin creates", () => {
    expect(HypothesisVerificationPayloadSchema.safeParse(hypothesisVerificationMethod.createEmptyPayload()).success).toBe(
      true,
    );
  });

  /** D-116's loose-role reasoning, one layer over: a newer build's verdict must round-trip. */
  it("accepts a verdict this build does not know", () => {
    const parsed = HypothesisVerificationPayloadSchema.parse({
      rows: [
        {
          id: "r1",
          candidateCause: "x",
          verificationMethod: "",
          evidence: "",
          verdict: "deferred",
          confidencePercent: "",
          residualUncertainty: "",
          customerRelevance: "",
        },
      ],
    });

    expect(parsed.rows[0]?.verdict).toBe("deferred");
  });

  /** B1's §13.4 candidate 5 (Oturum C/C1) — three new required row fields. */
  it("requires confidencePercent/residualUncertainty/customerRelevance on each row", () => {
    const result = HypothesisVerificationPayloadSchema.safeParse({
      rows: [{ id: "r1", candidateCause: "x", verificationMethod: "", evidence: "", verdict: "" }],
    });

    expect(result.success).toBe(false);
  });

  it("holds no reference inside the payload — the link is on the Entry (D-116)", () => {
    const parsed = HypothesisVerificationPayloadSchema.parse(hypothesisVerificationMethod.createEmptyPayload());

    expect("pointOfCauseId" in parsed).toBe(false);
  });
});

describe("hypothesisVerificationMethod", () => {
  it("declares one single-valued pointOfCause role targeting Step 2", () => {
    expect(hypothesisVerificationMethod.referenceRoles).toEqual([
      {
        role: "pointOfCause",
        labelKey: "methods.hypothesisVerification.references.pointOfCause.label",
        emptyKey: "methods.hypothesisVerification.references.pointOfCause.empty",
        fromSteps: [2],
        multiple: false,
      },
    ]);
  });

  it("belongs to Step 4", () => {
    expect(hypothesisVerificationMethod.steps).toEqual([4]);
  });
});
