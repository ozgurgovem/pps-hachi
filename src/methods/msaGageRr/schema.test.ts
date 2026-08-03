import { describe, expect, it } from "vitest";
import { MsaGageRrPayloadSchema } from "./schema";

describe("MsaGageRrPayloadSchema", () => {
  it("accepts a fully-filled payload", () => {
    const result = MsaGageRrPayloadSchema.safeParse({
      method: "Gage R&R (ANOVA)",
      evaluator: "Ayşe Yılmaz",
      date: "2026-08-01",
      percentGrr: "8.2",
      verdict: "trustworthy",
      note: "Within acceptable range",
    });
    expect(result.success).toBe(true);
  });

  it("accepts blank text fields — drafting in progress is normal (D-52)", () => {
    const result = MsaGageRrPayloadSchema.safeParse({
      method: "",
      evaluator: "",
      date: "",
      percentGrr: "",
      verdict: "inconclusive",
      note: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a verdict outside the fixed set", () => {
    const result = MsaGageRrPayloadSchema.safeParse({
      method: "",
      evaluator: "",
      date: "",
      percentGrr: "",
      verdict: "unknown",
      note: "",
    });
    expect(result.success).toBe(false);
  });
});
