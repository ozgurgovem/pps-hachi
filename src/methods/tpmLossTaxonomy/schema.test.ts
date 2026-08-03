import { describe, expect, it } from "vitest";
import { TpmLossTaxonomyPayloadSchema } from "./schema";

function tag(applies: boolean, severity: "low" | "medium" | "high" = "low") {
  return { applies, severity };
}

describe("TpmLossTaxonomyPayloadSchema", () => {
  it("accepts a payload with every category tagged", () => {
    const result = TpmLossTaxonomyPayloadSchema.safeParse({
      workSafety: tag(true, "high"),
      cost: tag(true, "medium"),
      productivity: tag(false),
      quality: tag(true, "low"),
      maintenance: tag(false),
      humanResources: tag(false),
      environment: tag(false),
    });
    expect(result.success).toBe(true);
  });

  it("rejects a severity outside the fixed set", () => {
    const result = TpmLossTaxonomyPayloadSchema.safeParse({
      workSafety: { applies: true, severity: "critical" },
      cost: tag(false),
      productivity: tag(false),
      quality: tag(false),
      maintenance: tag(false),
      humanResources: tag(false),
      environment: tag(false),
    });
    expect(result.success).toBe(false);
  });

  it("rejects a payload missing a category entirely", () => {
    const result = TpmLossTaxonomyPayloadSchema.safeParse({ workSafety: tag(false) });
    expect(result.success).toBe(false);
  });
});
