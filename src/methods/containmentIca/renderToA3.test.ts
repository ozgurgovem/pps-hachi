import { describe, expect, it } from "vitest";
import { renderContainmentIcaToA3 } from "./renderToA3";

describe("renderContainmentIcaToA3", () => {
  it("renders one line per non-blank containment row, after the bold title", () => {
    const content = renderContainmentIcaToA3(
      {
        rows: [
          {
            id: "1",
            action: "100% sort",
            owner: "Ayşe",
            startDate: "2026-08-01",
            effectivenessCheck: "Zero escapes",
            exitCriteria: "Root cause verified",
          },
        ],
      },
      { id: "e1", title: "Containment actions" },
    );

    expect(content.lines).toEqual([
      { text: "Containment actions", bold: true },
      { text: "100% sort · Ayşe · 2026-08-01 · Zero escapes · Root cause verified" },
    ]);
  });

  it("renders only the title line when there are no rows", () => {
    const content = renderContainmentIcaToA3({ rows: [] }, { id: "e1", title: "Containment actions" });
    expect(content.lines).toEqual([{ text: "Containment actions", bold: true }]);
  });
});
