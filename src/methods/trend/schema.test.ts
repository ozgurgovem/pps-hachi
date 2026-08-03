import { describe, expect, it } from "vitest";
import { TrendPayloadSchema } from "./schema";

describe("TrendPayloadSchema", () => {
  it("accepts a valid payload with target and events", () => {
    const result = TrendPayloadSchema.safeParse({
      unit: "PPM",
      points: [{ id: "p1", label: "Hafta 1", value: 120 }],
      targetValue: 20,
      targetLabel: "Hedef",
      events: [{ label: "Kalıp değişti", at: "Hafta 1" }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts a payload with no target set — target is optional", () => {
    const result = TrendPayloadSchema.safeParse({ unit: "PPM", points: [], events: [] });
    expect(result.success).toBe(true);
  });

  it("rejects a point missing a numeric value", () => {
    const result = TrendPayloadSchema.safeParse({
      unit: "PPM",
      points: [{ id: "p1", label: "Hafta 1" }],
      events: [],
    });
    expect(result.success).toBe(false);
  });
});
