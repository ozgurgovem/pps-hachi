import { describe, expect, it } from "vitest";
import { renderVocComplaintToA3 } from "./renderToA3";

describe("renderVocComplaintToA3", () => {
  it("renders one line per non-blank complaint row, after the bold title", () => {
    const content = renderVocComplaintToA3(
      {
        rows: [
          { id: "1", customer: "Farplas", claimNo: "C-100", partNo: "32-4471", ppm: "120", date: "2026-08-01" },
          { id: "2", customer: "", claimNo: "", partNo: "", ppm: "", date: "" },
        ],
      },
      { id: "e1", title: "Customer complaints" },
    );

    expect(content.lines).toEqual([
      { text: "Customer complaints", bold: true },
      { text: "Farplas · C-100 · 32-4471 · 120 · 2026-08-01" },
    ]);
  });

  it("renders only the title line when there are no rows", () => {
    const content = renderVocComplaintToA3({ rows: [] }, { id: "e1", title: "Customer complaints" });
    expect(content.lines).toEqual([{ text: "Customer complaints", bold: true }]);
  });
});
