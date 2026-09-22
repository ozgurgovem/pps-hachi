import { describe, expect, it } from "vitest";
import { pps8StepAuto } from "./pps-8step-auto";
import { getTemplateById, listTemplates, DEFAULT_TEMPLATE_ID } from "./registry";
import { A3_MIN_PRINTED_FONT_PT } from "../readability";
import { fitScale } from "../layout/measure";

/**
 * İKİ DEĞİŞMEZ KURALIN MEKANİK KAPISI — Barış, 2026-09-22.
 *
 * Anayasa Bölüm 4: a rule that lives only in a comment is a rule that gets
 * re-broken. Both of this session's rules are checkable, so they are checked
 * here rather than trusted:
 *
 *   1. Tek format, Rev00 ile birebir  — the geometry numbers below were read
 *      mechanically out of the reference workbook, and they are the same
 *      numbers the real, signed `PPS_A3_EK-2905` A3 carries.
 *   2. Basılı yazı en az 10 pt        — enforced against the fit scale, not
 *      against the authored size, because a sheet that Excel shrinks to fit
 *      prints smaller than it is authored.
 */

/** Read from `reference/PPS_A3_Problem_Solving_Template_Rev00.xlsx` with openpyxl on 2026-09-22. */
const REV00 = {
  rowCount: 45,
  rowHeightsPt: [
    28, 4, 18, 24, 24, 5,
    ...Array<number>(21).fill(18), // rows 7-27
    ...Array<number>(5).fill(19), // rows 28-32
    ...Array<number>(6).fill(18), // rows 33-38
    ...Array<number>(3).fill(16), // rows 39-41
    15, // row 42
    ...Array<number>(3).fill(14), // rows 43-45, the sheet's own defaultRowHeight
  ],
  totalHeightPt: 789,
  columnKeys: [
    "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L",
    "M",
    "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y",
  ],
  printArea: "A1:Y45",
  marginIn: 0.28,
  /** Rev00's own block titles, in its own reading order: left column top-to-bottom, then right. */
  blockTitles: [
    "ADIM 1 — PROBLEM TANIMI",
    "ADIM 2 — PROBLEMİ PARÇALARA AYIRMA",
    "ADIM 3 — HEDEF BELİRLEME",
    "ADIM 4 — KÖK NEDEN ANALİZİ",
    "ADIM 5 — UYGULAMA PLANI",
    "ADIM 6 — ÇÖZÜMLERİ UYGULAMA",
    "ADIM 7 — SONUÇLARI İZLEME",
    "ADIM 8 — STANDARDİZASYON / KURUMSALLAŞTIRMA",
  ],
} as const;

describe("Rev00 birebirlik kuralı (Barış 2026-09-22, DEĞİŞMEZ)", () => {
  it("has exactly one registered format, and it is the Rev00 form", () => {
    expect(listTemplates()).toHaveLength(1);
    expect(DEFAULT_TEMPLATE_ID).toBe("pps-8step-auto");
  });

  it("resolves a legacy or unknown templateId to the Rev00 form rather than stranding the project on another one", () => {
    expect(getTemplateById("farplas-7step-tr").id).toBe("pps-8step-auto");
    expect(getTemplateById("something-that-never-existed").id).toBe("pps-8step-auto");
    expect(getTemplateById("pps-8step-auto").id).toBe("pps-8step-auto");
  });

  it("reproduces Rev00's own 45 rows at Rev00's own heights", () => {
    expect(pps8StepAuto.rows).toHaveLength(REV00.rowCount);
    expect(pps8StepAuto.rows.map((row) => row.heightPt)).toEqual([...REV00.rowHeightsPt]);
    expect(pps8StepAuto.rows.reduce((sum, row) => sum + row.heightPt, 0)).toBe(REV00.totalHeightPt);
    expect(pps8StepAuto.rows.map((row) => row.index)).toEqual(
      Array.from({ length: REV00.rowCount }, (_unused, i) => i + 1),
    );
  });

  it("reproduces Rev00's own 12 / KAT / 12 column grid, foldable exactly in half", () => {
    expect(pps8StepAuto.columns.map((column) => column.key)).toEqual([...REV00.columnKeys]);
    const kat = pps8StepAuto.columns.find((column) => column.key === "M");
    expect(kat).toBeDefined();
    const left = pps8StepAuto.columns.slice(0, 12);
    const right = pps8StepAuto.columns.slice(13);
    // Both halves must be identical, or the sheet cannot fold down the KAT column.
    expect(left.map((c) => c.charWidth)).toEqual(right.map((c) => c.charWidth));
    expect(kat!.charWidth).toBeLessThan(left[0]!.charWidth);
  });

  it("reproduces Rev00's own print setup", () => {
    expect(pps8StepAuto.printArea).toBe(REV00.printArea);
    expect(pps8StepAuto.marginsIn).toEqual({
      top: REV00.marginIn,
      bottom: REV00.marginIn,
      left: REV00.marginIn,
      right: REV00.marginIn,
    });
    expect(pps8StepAuto.zoomPercent).toBe(100);
  });

  it("carries Rev00's own eight block titles, in Rev00's own order", () => {
    expect(pps8StepAuto.blocks.map((block) => block.label)).toEqual([...REV00.blockTitles]);
  });

  it("keeps the two halves of the block band row-aligned, so the fold stays true whatever the elastic solver does", () => {
    const span = (side: "A" | "N") => {
      const blocks = pps8StepAuto.blocks.filter((block) => block.contentColumns.first === side);
      return blocks.reduce((sum, block) => {
        const headerRows = Number(block.headerRange.split(":")[1]!.replace(/\D/g, "")) - Number(block.headerRange.match(/\d+/)![0]) + 1;
        return sum + headerRows + (block.contentRows.end - block.contentRows.start + 1);
      }, 0);
    };
    expect(span("A")).toBe(span("N"));
  });

  it("never lets a column's floors exceed the rows that column actually has", () => {
    for (const side of ["A", "N"] as const) {
      const blocks = pps8StepAuto.blocks.filter((block) => block.contentColumns.first === side);
      const headerRows = blocks.reduce((sum, block) => {
        const start = Number(block.headerRange.match(/\d+/)![0]);
        const end = Number(block.headerRange.split(":")[1]!.replace(/\D/g, ""));
        return sum + (end - start + 1);
      }, 0);
      const bandRows = blocks.reduce(
        (sum, block) => sum + (block.contentRows.end - block.contentRows.start + 1),
        headerRows,
      );
      const floors = blocks.reduce((sum, block) => sum + (block.elastic?.minimumCanvasRows ?? 0), 0);
      expect(floors + headerRows).toBeLessThanOrEqual(bandRows);
    }
  });

  it("gives every block that Rev00 gives a guidance strip one, and ADIM 4 — which Rev00 leaves bare — none", () => {
    const byStep = new Map(pps8StepAuto.blocks.map((block) => [block.appSteps[0], block]));
    for (const step of [1, 2, 3, 5, 6, 7, 8]) {
      expect(byStep.get(step as never)?.subHeader?.length ?? 0).toBeGreaterThan(0);
    }
    expect(byStep.get(4 as never)?.subHeader).toBeUndefined();
  });
});

describe("Okunabilirlik kuralı — basılı yazı en az 10 pt (Barış 2026-09-22, DEĞİŞMEZ)", () => {
  it("prints the app's own body text at or above the floor on every RENDERED template", () => {
    for (const template of listTemplates()) {
      // Excel's fit-to-page only ever shrinks, never magnifies.
      const scale = Math.min(1, fitScale(template.rows, template.marginsIn));
      const printedPt = template.bodyFontPt * scale;
      expect(
        printedPt,
        `${template.id}: body text prints at ${printedPt.toFixed(2)}pt, under the ${A3_MIN_PRINTED_FONT_PT}pt floor`,
      ).toBeGreaterThanOrEqual(A3_MIN_PRINTED_FONT_PT);
    }
  });

  it("declares a bodyFontPt that actually matches its own entryContent style, so wrapping and rendering cannot drift", () => {
    for (const template of listTemplates()) {
      const entryContent = template.styles.find((style) => style.id === "entryContent");
      expect(entryContent, `${template.id} has no entryContent style`).toBeDefined();
      expect(entryContent!.font?.sizePt).toBe(template.bodyFontPt);
    }
  });
});
