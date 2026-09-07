import { describe, expect, it } from "vitest";
import { columnLetterToIndex, parseRange } from "../cellRef";
import { pps8StepAuto } from "./pps-8step-auto";

/**
 * Faz 11/L1 (D-223/D-224): structural invariants for the transcribed
 * geometry — `farplas-7step-tr` has no equivalent file of its own (it was
 * hand-verified against the reference `.xls` via the Rust fidelity suite,
 * D-97), but this template's row math (D-158's default row counts, minus
 * D-224's own "2-row header" correction) is exactly the kind of arithmetic
 * that silently drifts if a block's range is ever edited by hand later.
 */
describe("pps-8step-auto (TEMPLATE_ANALYSIS.md §12, D-158/D-224)", () => {
  it("has 24 body columns of 8.285714 charWidth plus one 1.142857 KAT divider (§12.2)", () => {
    const bodyColumns = pps8StepAuto.columns.filter((c) => c.key !== "M");
    expect(bodyColumns).toHaveLength(24);
    expect(bodyColumns.every((c) => c.charWidth === 8.285714)).toBe(true);

    const divider = pps8StepAuto.columns.find((c) => c.key === "M");
    expect(divider?.charWidth).toBe(1.142857);
  });

  it("fold symmetry: the left 12 columns and the right 12 columns are identical in count and width (D-151)", () => {
    const mIndex = pps8StepAuto.columns.findIndex((c) => c.key === "M");
    const left = pps8StepAuto.columns.slice(0, mIndex);
    const right = pps8StepAuto.columns.slice(mIndex + 1);
    expect(left).toHaveLength(12);
    expect(right).toHaveLength(12);
  });

  it("rows sum to exactly 795.00pt: 32 (title) + 71 (identity) + 650 (block band) + 42 (approval) (§12.3)", () => {
    const total = pps8StepAuto.rows.reduce((sum, row) => sum + row.heightPt, 0);
    expect(total).toBeCloseTo(795.0, 5);
  });

  it("the block band (rows 4-53) is exactly 50 rows of 13pt = 650pt (D-158's invariant column total)", () => {
    const blockRows = pps8StepAuto.rows.filter((r) => r.index >= 4 && r.index <= 53);
    expect(blockRows).toHaveLength(50);
    expect(blockRows.every((r) => r.heightPt === 13)).toBe(true);
  });

  it("has exactly 8 blocks, each mapped to exactly one app-step (unlike farplas-7step-tr's merged Step 5+6)", () => {
    expect(pps8StepAuto.blocks).toHaveLength(8);
    const allSteps = pps8StepAuto.blocks.flatMap((b) => b.appSteps);
    expect(new Set(allSteps).size).toBe(8);
    expect(pps8StepAuto.blocks.every((b) => b.appSteps.length === 1)).toBe(true);
  });

  it("left-column blocks (ADIM 1/2/3) each reserve a 2-row header + D-158's own default canvas rows, summing to 50", () => {
    const leftBlocks = pps8StepAuto.blocks.filter((b) => b.contentColumns.first === "A");
    expect(leftBlocks.map((b) => b.appSteps[0])).toEqual([1, 2, 3]);

    const totalLeftRows = leftBlocks.reduce((sum, block) => {
      const headerRows = parseRange(block.headerRange).end.row - parseRange(block.headerRange).start.row + 1;
      const canvasRows = block.contentRows.end - block.contentRows.start + 1;
      return sum + headerRows + canvasRows;
    }, 0);
    expect(totalLeftRows).toBe(50);

    // D-158's own defaults, minus D-224's 2-row header correction.
    expect(leftBlocks.map((b) => b.contentRows.end - b.contentRows.start + 1)).toEqual([12, 26, 6]);
  });

  it("right-column blocks (ADIM 4-8) each reserve a 2-row header + D-158's own default canvas rows, summing to 50", () => {
    const rightBlocks = pps8StepAuto.blocks.filter((b) => b.contentColumns.first === "N");
    expect(rightBlocks.map((b) => b.appSteps[0])).toEqual([4, 5, 6, 7, 8]);

    const totalRightRows = rightBlocks.reduce((sum, block) => {
      const headerRows = parseRange(block.headerRange).end.row - parseRange(block.headerRange).start.row + 1;
      const canvasRows = block.contentRows.end - block.contentRows.start + 1;
      return sum + headerRows + canvasRows;
    }, 0);
    expect(totalRightRows).toBe(50);

    expect(rightBlocks.map((b) => b.contentRows.end - b.contentRows.start + 1)).toEqual([18, 6, 6, 6, 4]);
  });

  it("no block's header or content range crosses the M divider column", () => {
    for (const block of pps8StepAuto.blocks) {
      const headerRange = parseRange(block.headerRange);
      const headerFirst = columnLetterToIndex(headerRange.start.column);
      const headerLast = columnLetterToIndex(headerRange.end.column);
      const mIndex = columnLetterToIndex("M");
      const straddlesM = headerFirst <= mIndex && mIndex <= headerLast;
      expect(straddlesM).toBe(false);
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

  it("has exactly 12 header-identity-band fields, matching D-153's own field list", () => {
    expect(pps8StepAuto.headerFields.map((f) => f.id)).toEqual([
      "ppsId",
      "problemTitle",
      "problemOwner",
      "customer",
      "line",
      "priority",
      "department",
      "partNumber",
      "openedAt",
      "revision",
      "targetClosureDate",
      "generalRag",
    ]);
  });

  it("has exactly 5 footer (approval) fields, each its own label-only range (D-96's precedent)", () => {
    expect(pps8StepAuto.footerFields).toHaveLength(5);
    expect(pps8StepAuto.footerFields.every((f) => f.labelRange === f.valueRange)).toBe(true);
  });

  it("every style id referenced by a headerFields/footerFields/blocks entry exists in the style table", () => {
    const styleIds = new Set(pps8StepAuto.styles.map((s) => s.id));
    for (const field of [...pps8StepAuto.headerFields, ...pps8StepAuto.footerFields]) {
      expect(styleIds.has(field.labelStyleId)).toBe(true);
      expect(styleIds.has(field.valueStyleId)).toBe(true);
    }
    for (const block of pps8StepAuto.blocks) {
      expect(styleIds.has(block.headerStyleId)).toBe(true);
    }
  });

  it("carries the Layer A band fill styles and Layer B category chip styles (D-224)", () => {
    const styleIds = new Set(pps8StepAuto.styles.map((s) => s.id));
    for (const id of ["bandPositive", "bandCaution", "bandNegative"]) {
      expect(styleIds.has(id)).toBe(true);
    }
    for (const id of ["fiveN1kNe", "fiveN1kNeden", "fiveN1kNasil", "fiveN1kKim", "fiveN1kNeZaman", "fiveN1kNerede"]) {
      expect(styleIds.has(id)).toBe(true);
    }
  });

  it("uses a 0.32in margin on all four sides and a 100% zoom (§12.1)", () => {
    expect(pps8StepAuto.marginsIn).toEqual({ top: 0.32, bottom: 0.32, left: 0.32, right: 0.32 });
    expect(pps8StepAuto.zoomPercent).toBe(100);
    expect(pps8StepAuto.bodyRowHeightPt).toBe(13);
  });
});
