import { describe, expect, it } from "vitest";
import { renderProcessFlowSipocToA3 } from "./renderToA3";

describe("renderProcessFlowSipocToA3", () => {
  it("renders one line per non-blank process step row, after the bold title", () => {
    const content = renderProcessFlowSipocToA3(
      {
        rows: [
          {
            id: "1",
            step: "Weld",
            supplier: "Press shop",
            input: "Stamped panel",
            process: "Robotic weld",
            output: "Welded assembly",
            customer: "Paint shop",
          },
        ],
      },
      { id: "e1", title: "Door panel process flow" },
    );

    expect(content.lines).toEqual([
      { text: "Door panel process flow", bold: true },
      { text: "Weld · Press shop · Stamped panel · Robotic weld · Welded assembly · Paint shop" },
    ]);
  });

  it("renders only the title line when there are no rows", () => {
    const content = renderProcessFlowSipocToA3({ rows: [] }, { id: "e1", title: "Door panel process flow" });
    expect(content.lines).toEqual([{ text: "Door panel process flow", bold: true }]);
  });
});
