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
    });
    expect(result.success).toBe(false);
  });
});
