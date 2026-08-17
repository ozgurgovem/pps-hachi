import { describe, expect, it } from "vitest";
import { renderYokotenTrackerToA3 } from "./renderToA3";

describe("renderYokotenTrackerToA3", () => {
  it("renders one line per non-blank spread-candidate row, after the bold title", () => {
    const content = renderYokotenTrackerToA3(
      {
        rows: [
          {
            id: "1",
            siteLine: "Bursa Plant — Line 2",
            applicability: "Same jig family",
            riskReviewed: "Yes",
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
      },
      { id: "e1", title: "Horizontal spread candidates" },
    );

    expect(content.lines).toEqual([
      { text: "Horizontal spread candidates", bold: true },
      {
        text:
          "Bursa Plant — Line 2 · Same jig family · Yes · Update work instruction · M. Yıldız · 2026-09-15 · inProgress · underReview · Awaiting line trial",
      },
    ]);
  });

  it("renders only the title line when there are no rows", () => {
    const content = renderYokotenTrackerToA3({ rows: [] }, { id: "e1", title: "Horizontal spread candidates" });
    expect(content.lines).toEqual([{ text: "Horizontal spread candidates", bold: true }]);
  });
});
