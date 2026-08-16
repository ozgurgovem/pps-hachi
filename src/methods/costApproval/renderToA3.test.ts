import { describe, expect, it } from "vitest";
import type { A3EntrySummary } from "../../a3/methodContract";
import { renderCostApprovalToA3 } from "./renderToA3";

const ENTRY: A3EntrySummary = { id: "e1", title: "Jig retool cost" };

describe("renderCostApprovalToA3", () => {
  it("exports the populated fields as label: value lines", () => {
    const lines = renderCostApprovalToA3(
      { costEstimate: "€4,200", approvalStatus: "approved", approvedBy: "Plant manager", approvalDate: "2026-08-10" },
      ENTRY,
    ).lines;

    expect(lines).toEqual([
      { text: "■ Jig retool cost", bold: true, tone: "positive" },
      { text: "Cost estimate: €4,200" },
      { text: "Approval status: approved" },
      { text: "Approved by: Plant manager" },
      { text: "Approval date: 2026-08-10" },
    ]);
  });

  it("drops blank fields", () => {
    const lines = renderCostApprovalToA3(
      { costEstimate: "", approvalStatus: "", approvedBy: "", approvalDate: "" },
      ENTRY,
    ).lines;
    expect(lines).toEqual([{ text: "Jig retool cost", bold: true }]);
  });

  /** P-37: D-41's shape-coded status marker on the title line. */
  it.each([
    ["approved", "■", "positive"],
    ["pending", "●", "caution"],
    ["rejected", "▲", "negative"],
  ] as const)("marks approvalStatus %s with glyph %s and tone %s", (approvalStatus, glyph, tone) => {
    const lines = renderCostApprovalToA3(
      { costEstimate: "", approvalStatus, approvedBy: "", approvalDate: "" },
      ENTRY,
    ).lines;

    expect(lines[0]).toEqual({ text: `${glyph} Jig retool cost`, bold: true, tone });
  });
});
