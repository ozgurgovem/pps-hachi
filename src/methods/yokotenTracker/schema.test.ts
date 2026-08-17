import { describe, expect, it } from "vitest";
import { YokotenTrackerPayloadSchema } from "./schema";

describe("YokotenTrackerPayloadSchema", () => {
  it("accepts a payload with several spread-candidate rows", () => {
    const result = YokotenTrackerPayloadSchema.safeParse({
      rows: [
        {
          id: "1",
          siteLine: "Bursa Plant — Line 2",
          applicability: "Same jig family, same supplier",
          riskReviewed: "Yes, reviewed with process engineer",
          actionRequired: "Update work instruction",
          owner: "M. Yıldız",
          dueDate: "2026-09-15",
          status: "inProgress",
          completionEvidence: "",
          effectivenessChecked: "",
          checkDate: "",
          result: "",
          approval: "underReview",
          notes: "Awaiting line trial",
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts an empty row list — no spread candidates recorded yet", () => {
    const result = YokotenTrackerPayloadSchema.safeParse({ rows: [] });
    expect(result.success).toBe(true);
  });

  it("rejects a row missing a field entirely", () => {
    const result = YokotenTrackerPayloadSchema.safeParse({ rows: [{ id: "1", siteLine: "Bursa Plant" }] });
    expect(result.success).toBe(false);
  });
});
