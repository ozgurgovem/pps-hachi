import { describe, expect, it } from "vitest";
import { confirmedRootCauseNumbers, visibleOutcome } from "./outcome";
import type { WhyWhyNode } from "./schema";

describe("visibleOutcome (§2.2)", () => {
  it("returns the stored outcome for a current leaf", () => {
    const nodes: WhyWhyNode[] = [{ id: "a", parentId: null, text: "x", outcome: "controlled" }];
    expect(visibleOutcome(nodes, nodes[0]!)).toBe("controlled");
  });

  it("hides the outcome once the node gains a child, without clearing the stored value", () => {
    const nodes: WhyWhyNode[] = [
      { id: "a", parentId: null, text: "x", outcome: "confirmedRootCause" },
      { id: "b", parentId: "a", text: "y" },
    ];
    expect(visibleOutcome(nodes, nodes[0]!)).toBeUndefined();
    expect(nodes[0]!.outcome).toBe("confirmedRootCause");
  });

  it("returns undefined for a leaf with no outcome set", () => {
    const nodes: WhyWhyNode[] = [{ id: "a", parentId: null, text: "x" }];
    expect(visibleOutcome(nodes, nodes[0]!)).toBeUndefined();
  });
});

describe("confirmedRootCauseNumbers (D-71: derived, never stored)", () => {
  it("numbers confirmed-root-cause leaves in depth-first order, starting at 1", () => {
    const nodes: WhyWhyNode[] = [
      { id: "a", parentId: null, text: "Çatlak Firesi" },
      { id: "a1", parentId: "a", text: "Lokma deforme", outcome: "confirmedRootCause" },
      { id: "b", parentId: null, text: "Setup Firesi" },
      { id: "b1", parentId: "b", text: "Tasarım hatası", outcome: "confirmedRootCause" },
    ];

    const numbers = confirmedRootCauseNumbers(nodes);
    expect(numbers.get("a1")).toBe(1);
    expect(numbers.get("b1")).toBe(2);
  });

  it("skips a node marked confirmedRootCause that is no longer a leaf", () => {
    const nodes: WhyWhyNode[] = [
      { id: "a", parentId: null, text: "x", outcome: "confirmedRootCause" },
      { id: "b", parentId: "a", text: "y", outcome: "confirmedRootCause" },
    ];

    const numbers = confirmedRootCauseNumbers(nodes);
    expect(numbers.has("a")).toBe(false);
    expect(numbers.get("b")).toBe(1);
  });

  it("ignores controlled leaves entirely — only confirmedRootCause gets a KN number", () => {
    const nodes: WhyWhyNode[] = [
      { id: "a", parentId: null, text: "x", outcome: "controlled" },
      { id: "b", parentId: null, text: "y", outcome: "confirmedRootCause" },
    ];

    const numbers = confirmedRootCauseNumbers(nodes);
    expect(numbers.has("a")).toBe(false);
    expect(numbers.get("b")).toBe(1);
  });

  it("returns an empty map for a tree with no confirmed root causes", () => {
    expect(confirmedRootCauseNumbers([]).size).toBe(0);
  });
});
