import { describe, expect, it } from "vitest";
import type { A3EntrySummary } from "../../a3/methodContract";
import { renderWhyWhyTreeToA3 } from "./renderToA3";

const ENTRY: A3EntrySummary = { id: "e1", title: "Why-why: press stop" };

describe("renderWhyWhyTreeToA3", () => {
  it("indents each level under its parent", () => {
    const lines = renderWhyWhyTreeToA3(
      {
        nodes: [
          { id: "a", parentId: null, text: "Press stopped" },
          { id: "b", parentId: "a", text: "Overload trip" },
          { id: "c", parentId: "b", text: "Die not lubricated" },
        ],
      },
      ENTRY,
    ).lines;

    expect(lines).toEqual([
      { text: "Why-why: press stop", bold: true },
      { text: "Press stopped" },
      { text: "    Overload trip" },
      { text: "        Die not lubricated" },
    ]);
  });

  /** Two answers to one why is the whole reason this method exists beside `fiveWhy`. */
  it("keeps both branches of a why that has two answers", () => {
    const lines = renderWhyWhyTreeToA3(
      {
        nodes: [
          { id: "a", parentId: null, text: "Leak" },
          { id: "b", parentId: "a", text: "Seal worn" },
          { id: "c", parentId: "a", text: "Bolt torque low" },
        ],
      },
      ENTRY,
    ).lines;

    expect(lines.slice(2)).toEqual([{ text: "    Seal worn" }, { text: "    Bolt torque low" }]);
  });

  it("drops blank nodes but keeps their populated children visible", () => {
    const lines = renderWhyWhyTreeToA3(
      {
        nodes: [
          { id: "a", parentId: null, text: "" },
          { id: "b", parentId: "a", text: "Real cause" },
        ],
      },
      ENTRY,
    ).lines;

    expect(lines.slice(1)).toEqual([{ text: "    Real cause" }]);
  });
});
