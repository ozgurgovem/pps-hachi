import { describe, expect, it } from "vitest";
import { StratificationMatrixPayloadSchema } from "./schema";

describe("StratificationMatrixPayloadSchema", () => {
  it("accepts a payload with several stratum rows", () => {
    const result = StratificationMatrixPayloadSchema.safeParse({
      rows: [
        {
          id: "1",
          line: "Line 3",
          shift: "2",
          machine: "M-12",
          cavity: "4",
          operator: "Ayşe",
          supplier: "Bosch",
          date: "2026-08-01",
          product: "Door panel",
          count: "17",
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts an empty row list — no strata recorded yet", () => {
    const result = StratificationMatrixPayloadSchema.safeParse({ rows: [] });
    expect(result.success).toBe(true);
  });

  it("rejects a row missing a field entirely", () => {
    const result = StratificationMatrixPayloadSchema.safeParse({ rows: [{ id: "1", line: "Line 3" }] });
    expect(result.success).toBe(false);
  });
});
