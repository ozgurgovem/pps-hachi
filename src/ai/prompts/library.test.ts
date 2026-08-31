import { describe, expect, it } from "vitest";
import { getPromptFile } from "./library";

describe("getPromptFile", () => {
  it("finds the real pareto.v1 prompt file for step 2", () => {
    const file = getPromptFile(2, "pareto", "v1");

    expect(file).toBeDefined();
    expect(file?.frontMatter.mode).toBe("draft");
    expect(file?.frontMatter.outputSchema).toBe("pareto");
    expect(file?.body.length).toBeGreaterThan(0);
  });

  it("returns undefined for a method/step/version with no prompt file", () => {
    expect(getPromptFile(2, "pareto", "v2")).toBeUndefined();
    expect(getPromptFile(4, "pareto", "v1")).toBeUndefined();
    expect(getPromptFile(2, "trend", "v1")).toBeUndefined();
  });
});
