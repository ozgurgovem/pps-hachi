import { describe, expect, it } from "vitest";
import { sustainPlanMethod } from ".";
import { SustainPlanPayloadSchema } from "./schema";

describe("SustainPlanPayloadSchema", () => {
  it("accepts the empty payload the plugin creates", () => {
    expect(SustainPlanPayloadSchema.safeParse(sustainPlanMethod.createEmptyPayload()).success).toBe(true);
  });

  it("belongs to Step 8", () => {
    expect(sustainPlanMethod.steps).toEqual([8]);
  });
});
