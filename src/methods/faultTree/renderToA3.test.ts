import { describe, expect, it } from "vitest";
import type { A3EntrySummary } from "../../a3/methodContract";
import { renderFaultTreeToA3 } from "./renderToA3";

const ENTRY: A3EntrySummary = { id: "e1", title: "FTA: seal leak" };

describe("renderFaultTreeToA3", () => {
  it("marks each node with its gate and indents by depth", () => {
    const lines = renderFaultTreeToA3(
      {
        nodes: [
          { id: "a", parentId: null, text: "Seal leaks", gate: "or" },
          { id: "b", parentId: "a", text: "Seal worn", gate: "basic" },
          { id: "c", parentId: "a", text: "Both bolts loose", gate: "and" },
        ],
      },
      ENTRY,
    ).lines;

    expect(lines).toEqual([
      { text: "FTA: seal leak", bold: true },
      { text: "[OR] Seal leaks" },
      { text: "    Seal worn" },
      { text: "    [AND] Both bolts loose" },
    ]);
  });

  it("leaves a basic event unmarked", () => {
    const lines = renderFaultTreeToA3(
      { nodes: [{ id: "a", parentId: null, text: "Bearing seized", gate: "basic" }] },
      ENTRY,
    ).lines;

    expect(lines[1]).toEqual({ text: "Bearing seized" });
  });
});
