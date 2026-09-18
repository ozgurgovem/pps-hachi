import { describe, expect, it } from "vitest";
import type { A3BlockContent } from "../methodContract";
import { groupIntoRuns } from "./widthFractionGroups";

interface FakeItem {
  readonly id: string;
  readonly content: A3BlockContent;
}

function plain(id: string): FakeItem {
  return { id, content: { lines: [{ text: id }] } };
}

function halfWidth(id: string): FakeItem {
  return { id, content: { lines: [], widthFraction: 0.5 } };
}

function zonedWithWidthFraction(id: string): FakeItem {
  return { id, content: { lines: [], zones: [{ widthFraction: 1 }], widthFraction: 0.5 } };
}

const contentOf = (item: FakeItem) => item.content;

describe("groupIntoRuns", () => {
  it("returns an empty list for no items", () => {
    expect(groupIntoRuns<FakeItem>([], contentOf)).toEqual([]);
  });

  it("puts every plain entry (no widthFraction) into its own single-item, non-side-by-side run", () => {
    const runs = groupIntoRuns([plain("a"), plain("b")], contentOf);
    expect(runs).toEqual([
      { items: [plain("a")], sideBySide: false },
      { items: [plain("b")], sideBySide: false },
    ]);
  });

  it("groups two consecutive widthFraction entries into one side-by-side run", () => {
    const runs = groupIntoRuns([halfWidth("gap"), halfWidth("5n1k")], contentOf);
    expect(runs).toHaveLength(1);
    expect(runs[0]!.sideBySide).toBe(true);
    expect(runs[0]!.items.map((item) => item.id)).toEqual(["gap", "5n1k"]);
  });

  it("a lone widthFraction entry with no sibling is its own non-side-by-side run (falls back to full width)", () => {
    const runs = groupIntoRuns([plain("before"), halfWidth("alone"), plain("after")], contentOf);
    expect(runs).toEqual([
      { items: [plain("before")], sideBySide: false },
      { items: [halfWidth("alone")], sideBySide: false },
      { items: [plain("after")], sideBySide: false },
    ]);
  });

  it("does not merge two widthFraction entries separated by a plain entry", () => {
    const runs = groupIntoRuns([halfWidth("a"), plain("mid"), halfWidth("b")], contentOf);
    expect(runs.map((run) => run.sideBySide)).toEqual([false, false, false]);
  });

  it("groups three consecutive widthFraction entries into one run", () => {
    const runs = groupIntoRuns([halfWidth("a"), halfWidth("b"), halfWidth("c")], contentOf);
    expect(runs).toHaveLength(1);
    expect(runs[0]!.items.map((item) => item.id)).toEqual(["a", "b", "c"]);
  });

  it("treats a zones entry as never side-by-side, even if it also declares widthFraction", () => {
    const runs = groupIntoRuns([zonedWithWidthFraction("z"), halfWidth("h")], contentOf);
    expect(runs).toEqual([
      { items: [zonedWithWidthFraction("z")], sideBySide: false },
      { items: [halfWidth("h")], sideBySide: false },
    ]);
  });

  it("preserves original order across mixed runs", () => {
    const runs = groupIntoRuns([plain("a"), halfWidth("b"), halfWidth("c"), plain("d")], contentOf);
    expect(runs.map((run) => run.items.map((item) => item.id))).toEqual([["a"], ["b", "c"], ["d"]]);
  });
});
