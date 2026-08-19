import { describe, expect, it } from "vitest";
import { realizedCostBenefitMethod } from ".";
import { RealizedCostBenefitPayloadSchema } from "./schema";

describe("RealizedCostBenefitPayloadSchema", () => {
  it("accepts the empty payload the plugin creates", () => {
    expect(RealizedCostBenefitPayloadSchema.safeParse(realizedCostBenefitMethod.createEmptyPayload()).success).toBe(true);
  });

  it("belongs to Step 7", () => {
    expect(realizedCostBenefitMethod.steps).toEqual([7]);
  });
});
