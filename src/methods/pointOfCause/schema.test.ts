import { describe, expect, it } from "vitest";
import { pointOfCauseMethod } from ".";
import { PointOfCausePayloadSchema } from "./schema";

describe("PointOfCausePayloadSchema", () => {
  it("accepts the empty payload the plugin creates", () => {
    expect(PointOfCausePayloadSchema.safeParse(pointOfCauseMethod.createEmptyPayload()).success).toBe(true);
  });

  it("keeps unknown keys (D-51)", () => {
    const parsed = PointOfCausePayloadSchema.parse({
      ...pointOfCauseMethod.createEmptyPayload(),
      futureField: "kept",
    });

    expect(parsed).toMatchObject({ futureField: "kept" });
  });

  it("rejects a payload missing a declared field", () => {
    expect(PointOfCausePayloadSchema.safeParse({ processStep: "OP30" }).success).toBe(false);
  });
});

describe("pointOfCauseMethod", () => {
  it("belongs to Step 2 only — the point of cause is Step 2's output, not Step 4's", () => {
    expect(pointOfCauseMethod.steps).toEqual([2]);
  });

  /** D-116: the chain's origin is a target, never a referrer. */
  it("declares no reference roles", () => {
    expect(pointOfCauseMethod.referenceRoles).toBeUndefined();
  });
});
