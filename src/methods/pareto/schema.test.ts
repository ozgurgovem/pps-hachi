import { describe, expect, it } from "vitest";
import { ParetoPayloadSchema } from "./schema";

describe("ParetoPayloadSchema", () => {
  it("accepts a valid payload", () => {
    const result = ParetoPayloadSchema.safeParse({
      unit: "adet",
      categories: [{ id: "c1", label: "Sızdırmazlık", count: 42 }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects a category missing a required field", () => {
    const result = ParetoPayloadSchema.safeParse({
      unit: "adet",
      categories: [{ id: "c1", label: "Sızdırmazlık" }],
    });
    expect(result.success).toBe(false);
  });

  it("preserves unknown keys instead of stripping them — D-51", () => {
    const parsed = ParetoPayloadSchema.parse({
      unit: "adet",
      categories: [],
      futureField: "should survive a round-trip",
    });
    expect(parsed).toMatchObject({ futureField: "should survive a round-trip" });
  });
});
