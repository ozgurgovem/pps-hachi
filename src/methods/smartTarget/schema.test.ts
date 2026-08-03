import { describe, expect, it } from "vitest";
import { SmartTargetPayloadSchema } from "./schema";

describe("SmartTargetPayloadSchema", () => {
  it("accepts a fully-filled SMART target payload", () => {
    const result = SmartTargetPayloadSchema.safeParse({
      metric: "Gürültü PPM",
      baseline: 120,
      target: 20,
      unit: "PPM",
      dueDate: "2026-09-01",
      owner: "Ayşe Yılmaz",
      prioritizedItems: [{ id: "i1", text: "Panel rezonansını azalt" }],
      stakeholderNote: "Üretim müdürü onayladı.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a payload with a non-numeric baseline", () => {
    const result = SmartTargetPayloadSchema.safeParse({
      metric: "Gürültü",
      baseline: "yüz yirmi",
      target: 20,
      unit: "PPM",
      dueDate: "2026-09-01",
      owner: "Ayşe",
      prioritizedItems: [],
      stakeholderNote: "",
    });
    expect(result.success).toBe(false);
  });
});
