import { describe, expect, it } from "vitest";
import { problemImpactMethod } from ".";
import { ProblemImpactPayloadSchema } from "./schema";

describe("ProblemImpactPayloadSchema", () => {
  it("accepts the empty payload the plugin creates", () => {
    expect(ProblemImpactPayloadSchema.safeParse(problemImpactMethod.createEmptyPayload()).success).toBe(true);
  });

  it("accepts a fully-filled payload with Pareto categories and loss fields", () => {
    const result = ProblemImpactPayloadSchema.safeParse({
      unit: "adet",
      categories: [{ id: "c1", label: "Sızdırmazlık", count: 12 }],
      monthlyLoss: "€4,200",
      yearlyLoss: "€50,400",
      currencyUnit: "EUR",
      calculationNote: "Hat 3 duruş süresine göre hesaplandı.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a category with a non-numeric count", () => {
    const result = ProblemImpactPayloadSchema.safeParse({
      unit: "adet",
      categories: [{ id: "c1", label: "Sızdırmazlık", count: "on iki" }],
      monthlyLoss: "",
      yearlyLoss: "",
      currencyUnit: "",
      calculationNote: "",
    });
    expect(result.success).toBe(false);
  });

  it("belongs to Step 1", () => {
    expect(problemImpactMethod.steps).toEqual([1]);
  });
});
