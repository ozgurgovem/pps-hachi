import { describe, expect, it } from "vitest";
import { farplas7StepTr } from "../templates/farplas-7step-tr";
import { computeBlockBudget } from "./budget";

describe("computeBlockBudget", () => {
  it("matches the documented block heights from TEMPLATE_ANALYSIS.md §3 (TR rows, ENG − 1)", () => {
    const documented: Record<string, number> = {
      "1. PROBLEMİN TANIMLANMASI": 420,
      "2. MEVCUT DURUM ANALİZİ": 1083.75,
      "3. HEDEF BELİRLEME": 153.75,
      "4. KÖK NEDEN ANALİZİ": 420,
      "5. KARŞI ÖNLEMLERİN BELİRLENMESİ VE FAALİYET PLANLARI": 390,
      "6. SONUÇLARIN KONTROLÜ": 540,
      "7. STANDARDİZASYON": 277.5,
    };

    for (const block of farplas7StepTr.blocks) {
      const budget = computeBlockBudget(farplas7StepTr, block);
      const expected = documented[block.label];
      expect(expected).toBeDefined();
      expect(budget.budgetPt).toBeCloseTo(expected!, 2);
    }
  });

  it("gives step 3 (Target Setting) exactly one content row — the smallest budget in the sheet", () => {
    const step3 = farplas7StepTr.blocks.find((b) => b.appSteps.includes(3))!;
    const budget = computeBlockBudget(farplas7StepTr, step3);
    expect(budget.rowCount).toBe(1);
  });
});
