import { describe, expect, it } from "vitest";
import { columnLetterToIndex, parseRange } from "../cellRef";
import { pps8StepAuto } from "./pps-8step-auto";

/**
 * Structural invariants for the Rev00 transcription.
 *
 * The GEOMETRY itself (row count/heights, column grid, print setup, block
 * titles, the elastic floors) is asserted in `rev00Fidelity.test.ts` against
 * the numbers measured straight out of the reference workbook — one source
 * of truth, not two (Anayasa Madde 2). What stays here is the structural
 * arithmetic that would silently drift if a range were ever hand-edited:
 * nothing straddling the fold, every referenced style id actually existing.
 *
 * 2026-09-22: the §12 page-contract assertions this file used to carry
 * (24 columns at 8.285714, 795pt of rows, a 50-row block band, 0.32in
 * margins) were all Oturum A's own WIDENED contract, not Rev00's. They are
 * gone, replaced by the measured values — see `pps-8step-auto.ts`'s own
 * header comment for why the widening was reverted.
 */
describe("pps-8step-auto — structural invariants", () => {
  it("has exactly 8 blocks, each mapped to exactly one app-step (unlike farplas-7step-tr's merged Step 5+6)", () => {
    expect(pps8StepAuto.blocks).toHaveLength(8);
    const allSteps = pps8StepAuto.blocks.flatMap((b) => b.appSteps);
    expect(new Set(allSteps).size).toBe(8);
    expect(pps8StepAuto.blocks.every((b) => b.appSteps.length === 1)).toBe(true);
  });

  it("fold symmetry: the left 12 columns and the right 12 columns are identical in count and width (D-151)", () => {
    const left = pps8StepAuto.columns.slice(0, 12);
    const right = pps8StepAuto.columns.slice(13);
    expect(left).toHaveLength(12);
    expect(right).toHaveLength(12);
    expect(left.map((c) => c.charWidth)).toEqual(right.map((c) => c.charWidth));
  });

  it("no block's header or content range crosses the M divider column", () => {
    const mIndex = columnLetterToIndex("M");
    for (const block of pps8StepAuto.blocks) {
      const headerRange = parseRange(block.headerRange);
      const headerFirst = columnLetterToIndex(headerRange.start.column);
      const headerLast = columnLetterToIndex(headerRange.end.column);
      expect(headerFirst <= mIndex && mIndex <= headerLast).toBe(false);

      const contentFirst = columnLetterToIndex(block.contentColumns.first);
      const contentLast = columnLetterToIndex(block.contentColumns.last);
      expect(contentFirst <= mIndex && mIndex <= contentLast).toBe(false);
    }
  });

  it("no guidance-strip cell crosses the M divider column either", () => {
    const mIndex = columnLetterToIndex("M");
    for (const block of pps8StepAuto.blocks) {
      for (const cell of block.subHeader ?? []) {
        const first = columnLetterToIndex(cell.firstCol);
        const last = columnLetterToIndex(cell.lastCol);
        expect(first <= mIndex && mIndex <= last).toBe(false);
        expect(first).toBeLessThanOrEqual(last);
      }
    }
  });

  it("every guidance strip spans exactly its own block's columns, with no gap and no overlap", () => {
    for (const block of pps8StepAuto.blocks) {
      const cells = block.subHeader;
      if (!cells || cells.length === 0) {
        continue;
      }
      expect(cells[0]!.firstCol).toBe(block.contentColumns.first);
      expect(cells[cells.length - 1]!.lastCol).toBe(block.contentColumns.last);
      for (let i = 1; i < cells.length; i += 1) {
        expect(columnLetterToIndex(cells[i]!.firstCol)).toBe(columnLetterToIndex(cells[i - 1]!.lastCol) + 1);
      }
    }
  });

  it("no header-identity-band field crosses the M divider column (D-189/D-190's own lesson)", () => {
    const mIndex = columnLetterToIndex("M");
    for (const field of pps8StepAuto.headerFields) {
      for (const range of [field.labelRange, field.valueRange]) {
        const parsed = parseRange(range);
        const first = columnLetterToIndex(parsed.start.column);
        const last = columnLetterToIndex(parsed.end.column);
        expect(first <= mIndex && mIndex <= last).toBe(false);
      }
    }
  });

  it("has exactly 12 header-identity-band fields, matching Rev00's own field list", () => {
    expect(pps8StepAuto.headerFields).toHaveLength(12);
    expect(pps8StepAuto.headerFields.map((f) => f.label)).toEqual([
      "PPS ID",
      "Problem Başlığı",
      "Problem Sahibi",
      "Müşteri / Tesis",
      "Hat / Makine",
      "Öncelik",
      "Bölüm",
      "Parça / Proses",
      "Açılış Tarihi",
      "Revizyon",
      "Hedef Kapanış",
      "Genel RAG",
    ]);
  });

  it("gives every approval field its own value cell on the row below its label (Rev00's own two-row band)", () => {
    expect(pps8StepAuto.footerFields).toHaveLength(11);
    for (const field of pps8StepAuto.footerFields) {
      expect(field.labelRange).not.toBe(field.valueRange);
      expect(parseRange(field.valueRange).start.row).toBe(parseRange(field.labelRange).start.row + 1);
    }
  });

  it("every style id referenced by a headerFields/footerFields/blocks/staticCells entry exists in the style table", () => {
    const styleIds = new Set(pps8StepAuto.styles.map((s) => s.id));
    for (const field of [...pps8StepAuto.headerFields, ...pps8StepAuto.footerFields]) {
      expect(styleIds.has(field.labelStyleId)).toBe(true);
      expect(styleIds.has(field.valueStyleId)).toBe(true);
    }
    for (const block of pps8StepAuto.blocks) {
      expect(styleIds.has(block.headerStyleId)).toBe(true);
      expect(styleIds.has(block.bodyStyleId)).toBe(true);
    }
    for (const cell of pps8StepAuto.staticCells) {
      expect(styleIds.has(cell.styleId)).toBe(true);
    }
    expect(styleIds.has(pps8StepAuto.canvasFillStyleId!)).toBe(true);
    // Emitted by `buildA3Layout` for every block declaring a guidance strip.
    expect(styleIds.has("blockSubHeader")).toBe(true);
  });

  it("no longer carries the retired Layer A/B fillStyleId chip styles (BVVL round)", () => {
    const styleIds = new Set(pps8StepAuto.styles.map((s) => s.id));
    for (const id of ["bandPositive", "bandCaution", "bandNegative"]) {
      expect(styleIds.has(id)).toBe(false);
    }
    for (const id of ["fiveN1kNe", "fiveN1kNeden", "fiveN1kNasil", "fiveN1kKim", "fiveN1kNeZaman", "fiveN1kNerede"]) {
      expect(styleIds.has(id)).toBe(false);
    }
  });

  it("declares a body row height matching Rev00's own 18pt block-band rows", () => {
    expect(pps8StepAuto.bodyRowHeightPt).toBe(18);
  });
});
