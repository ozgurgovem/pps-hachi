import { describe, expect, it } from "vitest";
import { renderSustainmentAuditToA3 } from "./renderToA3";

describe("renderSustainmentAuditToA3", () => {
  it("renders one line per non-blank audit row, after the bold title", () => {
    const content = renderSustainmentAuditToA3(
      {
        rows: [
          {
            id: "1",
            auditDate: "2026-08-01",
            areaLine: "Line 3",
            standardChecked: "WI-204",
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
      },
      { id: "e1", title: "Weld station audits" },
    );

    expect(content.lines).toEqual([
      { text: "Weld station audits", bold: true },
      {
        text:
          "2026-08-01 · Line 3 · WI-204 · 20 · 19 · 1 · 95 · M. Yıldız · Torque log missing one entry · A-118 · 2026-09-01 · verified",
      },
    ]);
  });

  it("renders only the title line when there are no rows", () => {
    const content = renderSustainmentAuditToA3({ rows: [] }, { id: "e1", title: "Weld station audits" });
    expect(content.lines).toEqual([{ text: "Weld station audits", bold: true }]);
  });
});
