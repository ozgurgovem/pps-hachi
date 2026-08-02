import { describe, expect, it } from "vitest";
import { parseCoachingMarkdown } from "./coachingMarkdown";

describe("parseCoachingMarkdown", () => {
  it("parses headings, paragraphs and lists into separate blocks", () => {
    const markdown = [
      "# What this step is for",
      "",
      "State the gap in numbers.",
      "",
      "## Common failure modes",
      "",
      "- No number",
      "- No baseline",
      "",
      "## Worked example",
      "",
      "Bad: too many rejects.",
    ].join("\n");

    const blocks = parseCoachingMarkdown(markdown);

    expect(blocks).toEqual([
      { type: "heading", text: "What this step is for" },
      { type: "paragraph", text: "State the gap in numbers." },
      { type: "heading", text: "Common failure modes" },
      { type: "list", items: ["No number", "No baseline"] },
      { type: "heading", text: "Worked example" },
      { type: "paragraph", text: "Bad: too many rejects." },
    ]);
  });

  it("joins consecutive non-blank lines into a single paragraph", () => {
    const blocks = parseCoachingMarkdown("Line one\nLine two");
    expect(blocks).toEqual([{ type: "paragraph", text: "Line one Line two" }]);
  });

  it("returns an empty array for empty input", () => {
    expect(parseCoachingMarkdown("")).toEqual([]);
  });
});
