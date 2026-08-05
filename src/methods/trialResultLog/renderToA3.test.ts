import { describe, expect, it } from "vitest";
import { renderTrialResultLogToA3 } from "./renderToA3";

describe("renderTrialResultLogToA3", () => {
  it("renders one line per non-blank result row, after the bold title", () => {
    const content = renderTrialResultLogToA3(
      { rows: [{ id: "1", date: "2026-08-10", result: "Pass", note: "500/500 OK" }] },
      { id: "e1", title: "Trial results" },
    );

    expect(content.lines).toEqual([
      { text: "Trial results", bold: true },
      { text: "2026-08-10 · Pass · 500/500 OK" },
    ]);
  });

  it("renders only the title line when there are no rows", () => {
    expect(renderTrialResultLogToA3({ rows: [] }, { id: "e1", title: "Trial results" }).lines).toEqual([
      { text: "Trial results", bold: true },
    ]);
  });
});
