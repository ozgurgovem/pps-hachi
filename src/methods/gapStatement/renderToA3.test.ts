import { describe, expect, it } from "vitest";
import { renderGapStatementToA3 } from "./renderToA3";
import type { GapStatementPayload } from "./schema";

function emptyPayload(): GapStatementPayload {
  return { ideal: "", actual: "", gap: "", gapValue: 0, unit: "", baselinePeriod: "" };
}

describe("renderGapStatementToA3", () => {
  it("renders only the non-blank fields as labeled lines, after the bold title", () => {
    const payload: GapStatementPayload = { ...emptyPayload(), ideal: "Zero leaks", gap: "3 PPM" };
    const content = renderGapStatementToA3(payload, { id: "e1", title: "Leak at final test" });

    expect(content.lines).toEqual([
      { text: "Leak at final test", bold: true },
      { text: "Ideal: Zero leaks" },
      { text: "Gap: 3 PPM" },
    ]);
  });

  it("renders only the title line when every field is blank", () => {
    const content = renderGapStatementToA3(emptyPayload(), { id: "e1", title: "Leak at final test" });
    expect(content.lines).toEqual([{ text: "Leak at final test", bold: true }]);
  });

  /** D-188/P-26: `entry.language` picks the Turkish field labels. */
  it("uses Turkish field labels when the entry's language is tr", () => {
    const payload: GapStatementPayload = { ...emptyPayload(), ideal: "Sıfır kaçak" };
    const content = renderGapStatementToA3(payload, { id: "e1", title: "Leak at final test", language: "tr" });

    expect(content.lines).toEqual([
      { text: "Leak at final test", bold: true },
      { text: "İdeal: Sıfır kaçak" },
    ]);
  });

  /** D-196: the quantification fields render after the free-text ones, gap value only when non-zero. */
  it("renders the gap-quantification fields after the free-text ones", () => {
    const payload: GapStatementPayload = {
      ...emptyPayload(),
      gap: "3 PPM above ideal",
      gapValue: 3,
      unit: "PPM",
      baselinePeriod: "Q2 2026",
    };
    const content = renderGapStatementToA3(payload, { id: "e1", title: "Leak at final test" });

    expect(content.lines).toEqual([
      { text: "Leak at final test", bold: true },
      { text: "Gap: 3 PPM above ideal" },
      { text: "Gap size: 3" },
      { text: "Unit: PPM" },
      { text: "Baseline period: Q2 2026" },
    ]);
  });

  it("omits the gap-size line when gapValue is still the 0 default", () => {
    const payload: GapStatementPayload = { ...emptyPayload(), unit: "PPM" };
    const content = renderGapStatementToA3(payload, { id: "e1", title: "Leak at final test" });

    expect(content.lines).toEqual([
      { text: "Leak at final test", bold: true },
      { text: "Unit: PPM" },
    ]);
  });
});
