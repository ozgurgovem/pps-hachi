import { describe, expect, it } from "vitest";
import { trialResultLogMethod } from ".";
import { TrialResultLogPayloadSchema } from "./schema";

describe("TrialResultLogPayloadSchema", () => {
  it("accepts a payload with several logged results", () => {
    expect(
      TrialResultLogPayloadSchema.safeParse({
        rows: [{ id: "1", date: "2026-08-10", result: "Pass", note: "500/500 pcs OK" }],
      }).success,
    ).toBe(true);
  });

  it("accepts the empty payload the plugin creates", () => {
    expect(TrialResultLogPayloadSchema.safeParse(trialResultLogMethod.createEmptyPayload()).success).toBe(true);
  });

  it("belongs to Step 6", () => {
    expect(trialResultLogMethod.steps).toEqual([6]);
  });
});
