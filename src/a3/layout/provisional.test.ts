import { describe, expect, it } from "vitest";
import type { ReadinessResult } from "../../domain/readiness";
import type { StepId } from "../../domain/model";
import { computeProvisionalBlockMarker } from "./provisional";
import type { TemplateBlock } from "../templates/types";

function readinessResult(status: "ok" | "flagged"): ReadinessResult {
  return { status, warnings: status === "flagged" ? [{ rule: "S1", messageKey: "workspace.readiness.s1" }] : [] };
}

function allOk(): Readonly<Record<StepId, ReadinessResult>> {
  return {
    1: readinessResult("ok"),
    2: readinessResult("ok"),
    3: readinessResult("ok"),
    4: readinessResult("ok"),
    5: readinessResult("ok"),
    6: readinessResult("ok"),
    7: readinessResult("ok"),
    8: readinessResult("ok"),
  };
}

function block(overrides: Partial<TemplateBlock> = {}): TemplateBlock {
  return {
    appSteps: [1],
    label: "1. PROBLEMİN TANIMLANMASI",
    headerRange: "B7:O7",
    headerFill: "FF000000",
    headerStyleId: "blockHeader",
    bodyStyleId: "bodyCell",
    contentColumns: { first: "B", last: "O" },
    contentRows: { start: 8, end: 21 },
    ...overrides,
  };
}

describe("computeProvisionalBlockMarker", () => {
  it("returns undefined when none of the block's appSteps are flagged", () => {
    expect(computeProvisionalBlockMarker(block({ appSteps: [1] }), allOk())).toBeUndefined();
  });

  it("returns a marker covering the block's full rectangle when its single step is flagged", () => {
    const readiness = { ...allOk(), 1: readinessResult("flagged") };

    const marker = computeProvisionalBlockMarker(block({ appSteps: [1] }), readiness);

    expect(marker).toEqual({ stepIds: [1], range: "B7:O21" });
  });

  it("flags a multi-step block when only one of its steps is flagged (OR across appSteps)", () => {
    const readiness = { ...allOk(), 6: readinessResult("flagged") };
    const mergedBlock = block({
      appSteps: [5, 6],
      headerRange: "P22:AB22",
      contentColumns: { first: "P", last: "AB" },
      contentRows: { start: 23, end: 35 },
    });

    const marker = computeProvisionalBlockMarker(mergedBlock, readiness);

    expect(marker).toEqual({ stepIds: [5, 6], range: "P22:AB35" });
  });

  it("does not flag a multi-step block when none of its steps are flagged", () => {
    const mergedBlock = block({
      appSteps: [5, 6],
      headerRange: "P22:AB22",
      contentColumns: { first: "P", last: "AB" },
      contentRows: { start: 23, end: 35 },
    });

    expect(computeProvisionalBlockMarker(mergedBlock, allOk())).toBeUndefined();
  });
});
