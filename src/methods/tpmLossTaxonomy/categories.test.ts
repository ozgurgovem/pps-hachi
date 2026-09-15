import { describe, expect, it } from "vitest";
import { TPM_LOSS_CATEGORIES } from "./categories";

describe("TPM_LOSS_CATEGORIES", () => {
  // D-267/P-66: eight categories, in the real TR form's own `U2:AB2` order
  // (`TEMPLATE_ANALYSIS.md` §9.6) — Maintenance split into Autonomous and
  // Professional Maintenance, not the ENG form's original seven-category
  // list.
  it("has exactly the eight real TR-form categories, in the real TR-form order", () => {
    expect(TPM_LOSS_CATEGORIES).toEqual([
      "workSafety",
      "cost",
      "productivity",
      "quality",
      "autonomousMaintenance",
      "professionalMaintenance",
      "humanResources",
      "environment",
    ]);
  });
});
