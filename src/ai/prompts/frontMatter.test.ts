import { describe, expect, it } from "vitest";
import { parsePromptFile, parseWholeProjectPromptFile } from "./frontMatter";

const VALID = `---
mode: draft
methodId: pareto
step: 2
version: v1
outputSchema: pareto
contextSlices: []
---

Draft a Pareto payload from the user's data.
`;

describe("parsePromptFile", () => {
  it("parses front-matter fields and trims the body", () => {
    const file = parsePromptFile(VALID);

    expect(file.frontMatter).toEqual({
      mode: "draft",
      methodId: "pareto",
      step: 2,
      version: "v1",
      outputSchema: "pareto",
      contextSlices: [],
    });
    expect(file.body).toBe("Draft a Pareto payload from the user's data.");
  });

  it("parses a non-empty bracketed list into an array of trimmed strings", () => {
    const withSlices = VALID.replace("contextSlices: []", "contextSlices: [problemStatement, targetValue]");

    const file = parsePromptFile(withSlices);

    expect(file.frontMatter.contextSlices).toEqual(["problemStatement", "targetValue"]);
  });

  it("throws when the file doesn't start with a front-matter delimiter", () => {
    expect(() => parsePromptFile("mode: draft\n---\nbody")).toThrow(/front-matter delimiter/);
  });

  it("throws when the front-matter has no closing delimiter", () => {
    expect(() => parsePromptFile("---\nmode: draft\nbody with no closing fence")).toThrow(
      /closing/,
    );
  });

  it("throws when a required field is missing", () => {
    const missingMode = VALID.replace("mode: draft\n", "");

    expect(() => parsePromptFile(missingMode)).toThrow(/"mode"/);
  });

  it("throws when step is not an integer", () => {
    const badStep = VALID.replace("step: 2", "step: two");

    expect(() => parsePromptFile(badStep)).toThrow(/integer/);
  });

  it("throws on a malformed front-matter line with no colon", () => {
    const malformed = VALID.replace("mode: draft", "mode draft");

    expect(() => parsePromptFile(malformed)).toThrow(/Malformed front-matter line/);
  });
});

const VALID_WHOLE_PROJECT = `---
mode: draft
purpose: layout-review
version: v1
outputSchema: layout-review
contextSlices: []
---

Review the whole project's A3 layout.
`;

describe("parseWholeProjectPromptFile", () => {
  it("parses front-matter fields (purpose instead of step/methodId) and trims the body", () => {
    const file = parseWholeProjectPromptFile(VALID_WHOLE_PROJECT);

    expect(file.frontMatter).toEqual({
      mode: "draft",
      purpose: "layout-review",
      version: "v1",
      outputSchema: "layout-review",
      contextSlices: [],
    });
    expect(file.body).toBe("Review the whole project's A3 layout.");
  });

  it("throws when the required purpose field is missing", () => {
    const missingPurpose = VALID_WHOLE_PROJECT.replace("purpose: layout-review\n", "");

    expect(() => parseWholeProjectPromptFile(missingPurpose)).toThrow(/"purpose"/);
  });

  it("shares the same delimiter/malformed-line errors as parsePromptFile", () => {
    expect(() => parseWholeProjectPromptFile("purpose: layout-review\n---\nbody")).toThrow(
      /front-matter delimiter/,
    );
    expect(() => parseWholeProjectPromptFile("---\npurpose: layout-review\nno closing fence")).toThrow(
      /closing/,
    );
  });
});
