import { describe, expect, it } from "vitest";
import { ContainmentIcaPayloadSchema } from "./schema";

describe("ContainmentIcaPayloadSchema", () => {
  it("accepts a payload with several containment action rows", () => {
    const result = ContainmentIcaPayloadSchema.safeParse({
      rows: [
        {
          id: "1",
          action: "100% sort at final inspection",
          owner: "Ayşe Yılmaz",
          startDate: "2026-08-01",
          effectivenessCheck: "Zero escapes over 3 shifts",
          exitCriteria: "Root cause countermeasure verified",
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts an empty row list — no containment logged yet", () => {
    const result = ContainmentIcaPayloadSchema.safeParse({ rows: [] });
    expect(result.success).toBe(true);
  });

  it("rejects a row missing a field entirely", () => {
    const result = ContainmentIcaPayloadSchema.safeParse({ rows: [{ id: "1", action: "Sort" }] });
    expect(result.success).toBe(false);
  });
});
