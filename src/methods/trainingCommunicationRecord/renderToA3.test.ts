import { describe, expect, it } from "vitest";
import { renderTrainingCommunicationRecordToA3 } from "./renderToA3";

describe("renderTrainingCommunicationRecordToA3", () => {
  it("renders one line per non-blank record row, after the bold title", () => {
    const content = renderTrainingCommunicationRecordToA3(
      { rows: [{ id: "1", date: "2026-08-10", audience: "Line 3 operators", method: "Toolbox talk", acknowledgedBy: "12 signed" }] },
      { id: "e1", title: "Training log" },
    );

    expect(content.lines).toEqual([
      { text: "Training log", bold: true },
      { text: "2026-08-10 · Line 3 operators · Toolbox talk · 12 signed" },
    ]);
  });

  it("renders only the title line when there are no rows", () => {
    expect(renderTrainingCommunicationRecordToA3({ rows: [] }, { id: "e1", title: "Training log" }).lines).toEqual([
      { text: "Training log", bold: true },
    ]);
  });
});
