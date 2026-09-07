import { describe, expect, it } from "vitest";
import { renderGapStatementToA3 } from "./renderToA3";
import type { GapStatementPayload } from "./schema";

function emptyPayload(): GapStatementPayload {
  return { ideal: "", actual: "", gap: "", gapValue: 0, unit: "", baselinePeriod: "" };
}

/**
 * D-223/D-224 (Faz 11/L1, §14.2): `gapStatement` now renders ADIM 1's two
 * mandatory panels as one entry's `zones` — a two-bar chart was explicitly
 * rejected (Barış, AskUserQuestion: `ideal`/`actual` are free text, D-162
 * forbids adding numeric fields this dilim) in favour of a plain-language
 * summary. `content.lines` stays `[]` — see the file's own doc comment for
 * why (an appendixed copy reads from the zones, not a separate list).
 */
describe("renderGapStatementToA3 (D-102 zones, D-224)", () => {
  it("emits no top-level lines and exactly two half-width zones", () => {
    const content = renderGapStatementToA3(emptyPayload(), { id: "e1", title: "Leak at final test" });

    expect(content.lines).toEqual([]);
    expect(content.zones).toHaveLength(2);
    expect(content.zones!.every((zone) => zone.widthFraction === 0.5)).toBe(true);
  });

  it("declares an explicit zonesRowSpan of 8, so a sibling zoned entry (fiveN1K) can follow it in the same block", () => {
    const content = renderGapStatementToA3(emptyPayload(), { id: "e1", title: "Leak at final test" });
    expect(content.zonesRowSpan).toBe(8);
  });

  it("the gap-analysis zone's header line includes the entry title, with no chart image", () => {
    const content = renderGapStatementToA3(emptyPayload(), { id: "e1", title: "Leak at final test" });
    const gapZone = content.zones![0]!;

    expect(gapZone.image).toBeUndefined();
    expect(gapZone.lines![0]).toEqual({ text: "1.2 Gap Analysis — Leak at final test", bold: true });
  });

  it("builds a plain-language headline from gap + baselinePeriod when both are set", () => {
    const payload: GapStatementPayload = {
      ...emptyPayload(),
      gap: "3 PPM above ideal",
      gapValue: 3,
      unit: "PPM",
      baselinePeriod: "Q2 2026",
    };
    const content = renderGapStatementToA3(payload, { id: "e1", title: "Leak at final test" });

    expect(content.zones![0]!.lines).toEqual([
      { text: "1.2 Gap Analysis — Leak at final test", bold: true },
      { text: "3 PPM above ideal (Q2 2026)", bold: true },
    ]);
  });

  it("falls back to the bare gapValue+unit as the headline when the free-text gap field is blank", () => {
    const payload: GapStatementPayload = { ...emptyPayload(), gapValue: 5, unit: "PPM", baselinePeriod: "Q2 2026" };
    const content = renderGapStatementToA3(payload, { id: "e1", title: "Leak at final test" });

    expect(content.zones![0]!.lines).toContainEqual({ text: "5 PPM (Q2 2026)", bold: true });
  });

  it("omits the headline entirely when neither gap text nor gapValue is set", () => {
    const content = renderGapStatementToA3(emptyPayload(), { id: "e1", title: "Leak at final test" });
    expect(content.zones![0]!.lines).toEqual([{ text: "1.2 Gap Analysis — Leak at final test", bold: true }]);
  });

  it("adds the ideal/actual free-text lines (untinted) below the headline when filled in", () => {
    const payload: GapStatementPayload = { ...emptyPayload(), ideal: "Zero leaks", actual: "Intermittent leak" };
    const content = renderGapStatementToA3(payload, { id: "e1", title: "Leak at final test" });

    expect(content.zones![0]!.lines).toEqual([
      { text: "1.2 Gap Analysis — Leak at final test", bold: true },
      { text: "Ideal: Zero leaks" },
      { text: "Actual: Intermittent leak" },
    ]);
  });

  it("the problem-statement zone always shows all three Layer A bands, with an em-dash placeholder when blank", () => {
    const content = renderGapStatementToA3(emptyPayload(), { id: "e1", title: "Leak at final test" });
    const bandZone = content.zones![1]!;

    expect(bandZone.lines).toEqual([
      { text: "1.3 Problem Statement", bold: true },
      { text: "Ideal: —", fillStyleId: "bandPositive" },
      { text: "Actual: —", fillStyleId: "bandCaution" },
      { text: "Gap: —", fillStyleId: "bandNegative" },
    ]);
  });

  it("fills the problem-statement bands with real text when the fields are set", () => {
    const payload: GapStatementPayload = {
      ...emptyPayload(),
      ideal: "Zero leaks",
      actual: "Intermittent leak",
      gap: "3 PPM above ideal",
    };
    const content = renderGapStatementToA3(payload, { id: "e1", title: "Leak at final test" });

    expect(content.zones![1]!.lines).toEqual([
      { text: "1.3 Problem Statement", bold: true },
      { text: "Ideal: Zero leaks", fillStyleId: "bandPositive" },
      { text: "Actual: Intermittent leak", fillStyleId: "bandCaution" },
      { text: "Gap: 3 PPM above ideal", fillStyleId: "bandNegative" },
    ]);
  });

  /** D-188/P-26: `entry.language` picks Turkish labels/headers throughout both zones. */
  it("uses Turkish field labels and zone headers when the entry's language is tr", () => {
    const payload: GapStatementPayload = { ...emptyPayload(), ideal: "Sıfır kaçak" };
    const content = renderGapStatementToA3(payload, { id: "e1", title: "Son test kaçağı", language: "tr" });

    expect(content.zones![0]!.lines).toEqual([
      { text: "1.2 Gap Analizi — Son test kaçağı", bold: true },
      { text: "İdeal: Sıfır kaçak" },
    ]);
    expect(content.zones![1]!.lines![0]).toEqual({ text: "1.3 Problem Statement", bold: true });
    expect(content.zones![1]!.lines![1]).toEqual({ text: "İdeal: Sıfır kaçak", fillStyleId: "bandPositive" });
  });
});
