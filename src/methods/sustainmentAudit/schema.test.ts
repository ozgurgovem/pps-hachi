import { describe, expect, it } from "vitest";
import { SustainmentAuditPayloadSchema } from "./schema";

describe("SustainmentAuditPayloadSchema", () => {
  it("accepts a payload with several audit rows", () => {
    const result = SustainmentAuditPayloadSchema.safeParse({
      rows: [
        {
          id: "1",
          auditDate: "2026-08-01",
          areaLine: "Line 3",
          standardChecked: "Work Instruction WI-204",
          sampleSize: "20",
          conforming: "19",
          nonconforming: "1",
          compliancePercent: "95",
          auditor: "M. Yıldız",
          finding: "Torque log missing one entry",
          reactionActionId: "A-118",
          nextAudit: "2026-09-01",
          status: "verified",
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts an empty row list — no audits recorded yet", () => {
    const result = SustainmentAuditPayloadSchema.safeParse({ rows: [] });
    expect(result.success).toBe(true);
  });

  it("rejects a row missing a field entirely", () => {
    const result = SustainmentAuditPayloadSchema.safeParse({ rows: [{ id: "1", auditDate: "2026-08-01" }] });
    expect(result.success).toBe(false);
  });
});
