import { describe, expect, it } from "vitest";
import type { A3EntrySummary } from "../../a3/methodContract";
import { renderErrorProofingHierarchyToA3 } from "./renderToA3";

const ENTRY: A3EntrySummary = { id: "e1", title: "Deflection poka-yoke" };

describe("renderErrorProofingHierarchyToA3", () => {
  it("exports the resolved level label, not the raw enum key", () => {
    const lines = renderErrorProofingHierarchyToA3({ level: "prevent", note: "" }, ENTRY).lines;
    expect(lines).toEqual([
      { text: "Deflection poka-yoke", bold: true },
      { text: "Level: Prevent (poka-yoke)" },
    ]);
  });

  it("appends a trimmed note when present", () => {
    const lines = renderErrorProofingHierarchyToA3({ level: "warn", note: "  Needs pilot  " }, ENTRY).lines;
    expect(lines[2]).toEqual({ text: "Needs pilot" });
  });

  it("omits the note line when blank", () => {
    const lines = renderErrorProofingHierarchyToA3({ level: "detect", note: "   " }, ENTRY).lines;
    expect(lines).toHaveLength(2);
  });
});
