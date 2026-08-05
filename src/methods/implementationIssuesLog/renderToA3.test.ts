import { describe, expect, it } from "vitest";
import { renderImplementationIssuesLogToA3 } from "./renderToA3";

describe("renderImplementationIssuesLogToA3", () => {
  it("renders one line per non-blank issue row, after the bold title", () => {
    const content = renderImplementationIssuesLogToA3(
      {
        rows: [
          { id: "1", date: "2026-08-10", issue: "Fixture misaligned", impact: "3 h downtime", resolution: "Realigned", status: "resolved" },
        ],
      },
      { id: "e1", title: "Issues log" },
    );

    expect(content.lines).toEqual([
      { text: "Issues log", bold: true },
      { text: "2026-08-10 · Fixture misaligned · 3 h downtime · Realigned · resolved" },
    ]);
  });

  it("renders only the title line when there are no rows", () => {
    expect(renderImplementationIssuesLogToA3({ rows: [] }, { id: "e1", title: "Issues log" }).lines).toEqual([
      { text: "Issues log", bold: true },
    ]);
  });
});
