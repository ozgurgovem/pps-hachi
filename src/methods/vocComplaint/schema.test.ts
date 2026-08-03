import { describe, expect, it } from "vitest";
import { VocComplaintPayloadSchema } from "./schema";

describe("VocComplaintPayloadSchema", () => {
  it("accepts a payload with several complaint rows", () => {
    const result = VocComplaintPayloadSchema.safeParse({
      rows: [
        { id: "1", customer: "Farplas", claimNo: "C-100", partNo: "32-4471", ppm: "120", date: "2026-08-01" },
        { id: "2", customer: "", claimNo: "", partNo: "", ppm: "", date: "" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts an empty row list — no complaints logged yet", () => {
    const result = VocComplaintPayloadSchema.safeParse({ rows: [] });
    expect(result.success).toBe(true);
  });

  it("rejects a row missing a field entirely", () => {
    const result = VocComplaintPayloadSchema.safeParse({ rows: [{ id: "1", customer: "Farplas" }] });
    expect(result.success).toBe(false);
  });
});
