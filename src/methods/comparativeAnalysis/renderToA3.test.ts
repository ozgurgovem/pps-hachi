import { describe, expect, it } from "vitest";
import type { A3EntrySummary } from "../../a3/methodContract";
import { renderComparativeAnalysisToA3 } from "./renderToA3";

const ENTRY: A3EntrySummary = { id: "e1", title: "Good vs bad cavity" };

describe("renderComparativeAnalysisToA3", () => {
  it("names what was compared, then one line per row", () => {
    const lines = renderComparativeAnalysisToA3(
      {
        subject: "Cavity 2 vs cavity 4",
        rows: [
          { id: "r1", characteristic: "Wall thickness", goodCase: "2.1 mm", badCase: "1.8 mm", difference: "-0.3 mm" },
        ],
      },
      ENTRY,
    ).lines;

    expect(lines).toEqual([
      { text: "Good vs bad cavity", bold: true },
      { text: "Compared: Cavity 2 vs cavity 4" },
      { text: "Wall thickness · 2.1 mm · 1.8 mm · -0.3 mm" },
    ]);
  });

  it("omits the subject line when it was left blank", () => {
    const lines = renderComparativeAnalysisToA3({ subject: "   ", rows: [] }, ENTRY).lines;

    expect(lines).toEqual([{ text: "Good vs bad cavity", bold: true }]);
  });
});
