import { describe, expect, it } from "vitest";
import { trialPlanMethod } from ".";
import { TrialPlanPayloadSchema } from "./schema";

describe("TrialPlanPayloadSchema", () => {
  it("accepts the empty payload the plugin creates", () => {
    expect(TrialPlanPayloadSchema.safeParse(trialPlanMethod.createEmptyPayload()).success).toBe(true);
  });

  it("belongs to Step 5", () => {
    expect(trialPlanMethod.steps).toEqual([5]);
  });
});
