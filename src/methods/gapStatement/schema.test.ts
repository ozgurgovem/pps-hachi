import { describe, expect, it } from "vitest";
import { GapStatementPayloadSchema } from "./schema";

describe("GapStatementPayloadSchema", () => {
  it("accepts a fully-filled payload", () => {
    const result = GapStatementPayloadSchema.safeParse({
      ideal: "Zero leaks at final test",
      actual: "3 leaks per 1000 units",
      gap: "3 PPM above the ideal state",
      gapValue: 3,
      unit: "PPM",
      baselinePeriod: "Q2 2026",
      idealValue: 0,
      actualValue: 3,
      targetDate: "Q3 2026",
    });
    expect(result.success).toBe(true);
  });

  it("accepts blank fields — drafting in progress is normal (D-52)", () => {
    const result = GapStatementPayloadSchema.safeParse({
      ideal: "",
      actual: "",
      gap: "",
      gapValue: 0,
      unit: "",
      baselinePeriod: "",
      idealValue: 0,
      actualValue: 0,
      targetDate: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a payload missing a required field entirely", () => {
    const result = GapStatementPayloadSchema.safeParse({ ideal: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a non-number gapValue", () => {
    const result = GapStatementPayloadSchema.safeParse({
      ideal: "",
      actual: "",
      gap: "",
      gapValue: "3",
      unit: "",
      baselinePeriod: "",
      idealValue: 0,
      actualValue: 0,
      targetDate: "",
    });
    expect(result.success).toBe(false);
  });

  /** ADIM 1 BVVL round (2026-09-16/17): idealValue/actualValue reverse D-162/D-224's earlier "no numeric fields" call. */
  it("rejects a non-number idealValue or actualValue", () => {
    const base = {
      ideal: "",
      actual: "",
      gap: "",
      gapValue: 0,
      unit: "",
      baselinePeriod: "",
      idealValue: 0,
      actualValue: 0,
      targetDate: "",
    };
    expect(GapStatementPayloadSchema.safeParse({ ...base, idealValue: "3" }).success).toBe(false);
    expect(GapStatementPayloadSchema.safeParse({ ...base, actualValue: "16.4" }).success).toBe(false);
  });
});
