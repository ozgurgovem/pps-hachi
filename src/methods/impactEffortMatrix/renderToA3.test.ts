import { describe, expect, it } from "vitest";
import type { A3EntrySummary } from "../../a3/methodContract";
import { renderImpactEffortMatrixToA3 } from "./renderToA3";

const ENTRY: A3EntrySummary = { id: "e1", title: "Impact/effort matrix" };

describe("renderImpactEffortMatrixToA3", () => {
  it("appends the computed quadrant label to each named item", () => {
    const lines = renderImpactEffortMatrixToA3(
      { items: [{ id: "1", description: "Automate weld check", impact: "5", effort: "1" }] },
      ENTRY,
    ).lines;

    expect(lines).toEqual([
      { text: "Impact/effort matrix", bold: true },
      { text: "Automate weld check — Quick win" },
    ]);
  });

  it("exports an unscored item's description alone, without inventing a quadrant", () => {
    const lines = renderImpactEffortMatrixToA3(
      { items: [{ id: "1", description: "Undecided item", impact: "", effort: "" }] },
      ENTRY,
    ).lines;

    expect(lines[1]).toEqual({ text: "Undecided item" });
  });

  it("drops unnamed items", () => {
    const lines = renderImpactEffortMatrixToA3(
      { items: [{ id: "1", description: "  ", impact: "5", effort: "1" }] },
      ENTRY,
    ).lines;

    expect(lines).toEqual([{ text: "Impact/effort matrix", bold: true }]);
  });

  /** D-188/P-26: `entry.language` picks the quadrant label. */
  it("uses the Turkish quadrant label when the entry's language is tr", () => {
    const trEntry: A3EntrySummary = { ...ENTRY, language: "tr" };
    const lines = renderImpactEffortMatrixToA3(
      { items: [{ id: "1", description: "Kaynak kontrolünü otomatikleştir", impact: "5", effort: "1" }] },
      trEntry,
    ).lines;

    expect(lines[1]).toEqual({ text: "Kaynak kontrolünü otomatikleştir — Hızlı kazanım" });
  });

  /** P-27: the real 2×2 scatter Barış chose over a text-only export. */
  describe("the 2×2 chart image", () => {
    it("includes only scored, named items as chart points", () => {
      const { image } = renderImpactEffortMatrixToA3(
        {
          items: [
            { id: "1", description: "Automate weld check", impact: "5", effort: "1" },
            { id: "2", description: "Undecided item", impact: "", effort: "" },
            { id: "3", description: "  ", impact: "4", effort: "4" },
          ],
        },
        ENTRY,
      );

      expect(image?.kind).toBe("impact-effort-chart");
      const spec = image?.spec as { items: readonly { label: string }[] };
      expect(spec.items).toEqual([{ label: "Automate weld check", impact: 5, effort: 1, quadrant: "quick-win" }]);
    });

    it("resolves the axis labels from the entry's language, English by default", () => {
      const { image } = renderImpactEffortMatrixToA3({ items: [] }, ENTRY);
      expect(image?.spec).toMatchObject({ xLabel: "Effort", yLabel: "Impact" });
    });

    it("resolves the Turkish axis labels when the entry's language is tr", () => {
      const trEntry: A3EntrySummary = { ...ENTRY, language: "tr" };
      const { image } = renderImpactEffortMatrixToA3({ items: [] }, trEntry);
      expect(image?.spec).toMatchObject({ xLabel: "Çaba", yLabel: "Etki" });
    });
  });
});
