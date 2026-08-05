import { describe, expect, it } from "vitest";
import { impactEffortMatrixMethod } from ".";
import { ImpactEffortMatrixPayloadSchema } from "./schema";

describe("ImpactEffortMatrixPayloadSchema", () => {
  it("accepts the empty payload the plugin creates", () => {
    expect(ImpactEffortMatrixPayloadSchema.safeParse(impactEffortMatrixMethod.createEmptyPayload()).success).toBe(true);
  });

  it("rejects a numeric impact score — stays string-typed per D-120", () => {
    expect(
      ImpactEffortMatrixPayloadSchema.safeParse({
        items: [{ id: "1", description: "x", impact: 5, effort: "1" }],
      }).success,
    ).toBe(false);
  });
});
