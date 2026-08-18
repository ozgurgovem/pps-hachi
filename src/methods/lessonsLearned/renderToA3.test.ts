import { describe, expect, it } from "vitest";
import { lessonsLearnedMethod } from ".";
import { renderLessonsLearnedToA3 } from "./renderToA3";
import type { LessonsLearnedPayload } from "./schema";

const EMPTY = lessonsLearnedMethod.createEmptyPayload() as LessonsLearnedPayload;
const ENTRY = { id: "e1", title: "Closure lessons learned" };

describe("renderLessonsLearnedToA3", () => {
  it("exports the populated answers as label: value lines", () => {
    const payload: LessonsLearnedPayload = {
      ...EMPTY,
      wentWell: "Fast containment",
      finalClosureRationale: "All actions verified effective over two audit cycles",
    };

    const lines = renderLessonsLearnedToA3(payload, ENTRY).lines;

    expect(lines).toEqual([
      { text: "Closure lessons learned", bold: true },
      { text: "What went well?: Fast containment" },
      { text: "Final closure rationale: All actions verified effective over two audit cycles" },
    ]);
  });

  it("renders only the title line when every answer is blank", () => {
    const lines = renderLessonsLearnedToA3(EMPTY, ENTRY).lines;
    expect(lines).toEqual([{ text: "Closure lessons learned", bold: true }]);
  });

  /** D-188/P-26: `entry.language` picks the export label variant. */
  it("uses Turkish field labels when the entry's language is tr", () => {
    const trEntry = { ...ENTRY, language: "tr" as const };
    const payload: LessonsLearnedPayload = { ...EMPTY, wentWell: "Hızlı kontrol altına alma" };

    const lines = renderLessonsLearnedToA3(payload, trEntry).lines;

    expect(lines).toEqual([
      { text: "Closure lessons learned", bold: true },
      { text: "Ne iyi gitti?: Hızlı kontrol altına alma" },
    ]);
  });
});
