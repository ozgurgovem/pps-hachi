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

  /**
   * Faz 10/K2: this file's own "doesn't exist yet" example collided with
   * K2's real `mock-audit.v1.md` the same way `library.test.ts`'s own
   * example once collided with J3-2's real output (D-207) — not a
   * regression, a forward-looking "not yet" assumption this slice disproved.
   */
  it("finds the real mock-audit.v1 prompt file", () => {
    const file = getWholeProjectPromptFile("mock-audit", "v1");

    expect(file).toBeDefined();
    expect(file?.frontMatter.mode).toBe("draft");
    expect(file?.frontMatter.outputSchema).toBe("mock-audit");
    expect(file?.body.length).toBeGreaterThan(0);
  });

  /** Faz 10/K3: the field-level translation prompt — see `entryTranslation.ts`. */
  it("finds the real translate-entry.v1 prompt file", () => {
    const file = getWholeProjectPromptFile("translate-entry", "v1");

    expect(file).toBeDefined();
    expect(file?.frontMatter.mode).toBe("draft");
    expect(file?.frontMatter.outputSchema).toBe("translate-entry");
    expect(file?.body.length).toBeGreaterThan(0);
  });

  /** Faz 10/K3: the whole-report translation prompt — see `entryTranslation.ts`. */
  it("finds the real translate-report.v1 prompt file", () => {
    const file = getWholeProjectPromptFile("translate-report", "v1");

    expect(file).toBeDefined();
    expect(file?.frontMatter.mode).toBe("draft");
    expect(file?.frontMatter.outputSchema).toBe("translate-report");
    expect(file?.body.length).toBeGreaterThan(0);
  });

  /** D-247: identifying which existing entry a chat suggestion targets — see `chatEntryEdit.ts`. */
  it("finds the real identify-suggestion-target.v1 prompt file", () => {
    const file = getWholeProjectPromptFile("identify-suggestion-target", "v1");

    expect(file).toBeDefined();
    expect(file?.frontMatter.mode).toBe("draft");
    expect(file?.frontMatter.outputSchema).toBe("identify-suggestion-target");
    expect(file?.body.length).toBeGreaterThan(0);
  });

  /** D-247: applying a confirmed chat suggestion to a specific entry — see `chatEntryEdit.ts`. */
  it("finds the real apply-suggestion.v1 prompt file", () => {
    const file = getWholeProjectPromptFile("apply-suggestion", "v1");

    expect(file).toBeDefined();
    expect(file?.frontMatter.mode).toBe("draft");
    expect(file?.frontMatter.outputSchema).toBe("apply-suggestion");
    expect(file?.body.length).toBeGreaterThan(0);
  });

  it("returns undefined for a purpose/version with no prompt file", () => {
    expect(getWholeProjectPromptFile("layout-review", "v2-does-not-exist")).toBeUndefined();
    expect(getWholeProjectPromptFile("mock-audit", "v2-does-not-exist")).toBeUndefined();
    expect(getWholeProjectPromptFile("translate-entry", "v2-does-not-exist")).toBeUndefined();
    expect(getWholeProjectPromptFile("translate-report", "v2-does-not-exist")).toBeUndefined();
    expect(getWholeProjectPromptFile("identify-suggestion-target", "v2-does-not-exist")).toBeUndefined();
    expect(getWholeProjectPromptFile("apply-suggestion", "v2-does-not-exist")).toBeUndefined();
  });
});
