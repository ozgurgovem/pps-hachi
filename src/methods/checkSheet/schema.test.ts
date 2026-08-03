import { describe, expect, it } from "vitest";
import { CheckSheetPayloadSchema } from "./schema";

describe("CheckSheetPayloadSchema", () => {
  it("accepts a payload with several tally rows", () => {
    const result = CheckSheetPayloadSchema.safeParse({
      rows: [{ id: "1", item: "Scratch", count: "12", date: "2026-08-01", note: "Mostly station 4" }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts an empty row list — no tallies recorded yet", () => {
    const result = CheckSheetPayloadSchema.safeParse({ rows: [] });
    expect(result.success).toBe(true);
  });

  it("rejects a row missing a field entirely", () => {
    const result = CheckSheetPayloadSchema.safeParse({ rows: [{ id: "1", item: "Scratch" }] });
    expect(result.success).toBe(false);
  });
});
