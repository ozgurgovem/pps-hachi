import { describe, expect, it } from "vitest";
import { renderStratificationMatrixToA3 } from "./renderToA3";

describe("renderStratificationMatrixToA3", () => {
  it("renders one line per non-blank stratum row, after the bold title", () => {
    const content = renderStratificationMatrixToA3(
      {
        rows: [
          {
            id: "1",
            line: "Line 3",
            shift: "2",
            machine: "",
            cavity: "",
            operator: "",
            supplier: "",
            date: "",
            product: "",
            count: "17",
          },
        ],
      },
      { id: "e1", title: "Defect stratification" },
    );

    expect(content.lines).toEqual([
      { text: "Defect stratification", bold: true },
      { text: "Line 3 · 2 · 17" },
    ]);
  });

  it("renders only the title line when there are no rows", () => {
    const content = renderStratificationMatrixToA3({ rows: [] }, { id: "e1", title: "Defect stratification" });
    expect(content.lines).toEqual([{ text: "Defect stratification", bold: true }]);
  });
});
