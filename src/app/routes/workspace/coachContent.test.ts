import { describe, expect, it } from "vitest";
import { STEP_IDS } from "../../../domain/model";
import { getCoachingMarkdown } from "./coachContent";

describe("getCoachingMarkdown", () => {
  it("has non-empty content for every step in both languages", () => {
    for (const stepId of STEP_IDS) {
      expect(getCoachingMarkdown("en", stepId).length).toBeGreaterThan(0);
      expect(getCoachingMarkdown("tr", stepId).length).toBeGreaterThan(0);
    }
  });

  it("returns an empty string for a language it has no content for", () => {
    // @ts-expect-error deliberately invalid language, to exercise the not-found path
    expect(getCoachingMarkdown("de", 1)).toBe("");
  });
});
