import { describe, expect, it } from "vitest";
import { getWholeProjectPromptFile } from "./wholeProjectLibrary";

describe("getWholeProjectPromptFile", () => {
  it("finds the real layout-review.v1 prompt file", () => {
    const file = getWholeProjectPromptFile("layout-review", "v1");

    expect(file).toBeDefined();
    expect(file?.frontMatter.mode).toBe("draft");
    expect(file?.frontMatter.outputSchema).toBe("layout-review");
    expect(file?.body.length).toBeGreaterThan(0);
  });

  it("returns undefined for a purpose/version with no prompt file", () => {
    expect(getWholeProjectPromptFile("layout-review", "v2-does-not-exist")).toBeUndefined();
    expect(getWholeProjectPromptFile("mock-audit", "v1")).toBeUndefined();
  });
});
