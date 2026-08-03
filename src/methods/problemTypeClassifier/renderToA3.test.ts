import { describe, expect, it } from "vitest";
import { renderProblemTypeClassifierToA3 } from "./renderToA3";

describe("renderProblemTypeClassifierToA3", () => {
  it("renders the classification and note after the bold title", () => {
    const content = renderProblemTypeClassifierToA3(
      { classification: "inconsistentPerformance", note: "Varies by shift" },
      { id: "e1", title: "Yield drop" },
    );

    expect(content.lines).toEqual([
      { text: "Yield drop", bold: true },
      { text: "Classification: Inconsistent performance" },
      { text: "Note: Varies by shift" },
    ]);
  });

  it("omits the note line when the note is blank", () => {
    const content = renderProblemTypeClassifierToA3(
      { classification: "belowStandard", note: "" },
      { id: "e1", title: "Yield drop" },
    );

    expect(content.lines).toEqual([
      { text: "Yield drop", bold: true },
      { text: "Classification: Below standard" },
    ]);
  });
});
