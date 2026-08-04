import { describe, expect, it } from "vitest";
import type { A3EntrySummary } from "../../a3/methodContract";
import { renderCategoryBreakdownToA3 } from "./renderToA3";

const ENTRY: A3EntrySummary = { id: "e1", title: "5M breakdown — çapak problemi" };

describe("renderCategoryBreakdownToA3", () => {
  it("groups rows by category in the fixed 5M order, not row insertion order", () => {
    const lines = renderCategoryBreakdownToA3(
      {
        rows: [
          { id: "r1", category: "measurement", subProblem: "Kalibrasyon aralığı geniş", effect: "Kaçak parça" },
          { id: "r2", category: "man", subProblem: "Eğitim eksik", effect: "Yanlış ayar" },
        ],
      },
      ENTRY,
    ).lines;

    expect(lines).toEqual([
      { text: "5M breakdown — çapak problemi", bold: true },
      { text: "Man", bold: true },
      { text: "  Eğitim eksik — Yanlış ayar" },
      { text: "Measurement", bold: true },
      { text: "  Kalibrasyon aralığı geniş — Kaçak parça" },
    ]);
  });

  it("omits a category with no populated row rather than printing it empty", () => {
    const lines = renderCategoryBreakdownToA3(
      { rows: [{ id: "r1", category: "man", subProblem: "x", effect: "" }] },
      ENTRY,
    ).lines;

    expect(lines).toEqual([
      { text: "5M breakdown — çapak problemi", bold: true },
      { text: "Man", bold: true },
      { text: "  x" },
    ]);
  });

  it("drops a fully blank row without printing a bare dash", () => {
    const lines = renderCategoryBreakdownToA3(
      { rows: [{ id: "r1", category: "man", subProblem: "  ", effect: "  " }] },
      ENTRY,
    ).lines;

    expect(lines).toEqual([{ text: "5M breakdown — çapak problemi", bold: true }]);
  });

  /** D-100's never-truncate guarantee, applied to a category outside the fixed 5M list. */
  it("still exports a row whose category matches none of the 5M options, under Other", () => {
    const lines = renderCategoryBreakdownToA3(
      { rows: [{ id: "r1", category: "environment", subProblem: "Nem oranı", effect: "Yapışma sorunu" }] },
      ENTRY,
    ).lines;

    expect(lines).toEqual([
      { text: "5M breakdown — çapak problemi", bold: true },
      { text: "Other" },
      { text: "  Nem oranı — Yapışma sorunu" },
    ]);
  });

  it("renders only the title when nothing has been filled in", () => {
    expect(renderCategoryBreakdownToA3({ rows: [] }, ENTRY).lines).toHaveLength(1);
  });
});
