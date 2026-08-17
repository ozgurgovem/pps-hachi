import { describe, expect, it } from "vitest";
import { whyWhyTreeMethod } from ".";
import { WhyWhyTreePayloadSchema } from "./schema";

describe("WhyWhyTreePayloadSchema", () => {
  it("accepts the empty payload the plugin creates", () => {
    expect(WhyWhyTreePayloadSchema.safeParse(whyWhyTreeMethod.createEmptyPayload()).success).toBe(true);
  });

  it("accepts a root node with a null parent and a child pointing at it", () => {
    const parsed = WhyWhyTreePayloadSchema.parse({
      nodes: [
        { id: "a", parentId: null, text: "Press stopped" },
        { id: "b", parentId: "a", text: "Overload trip" },
      ],
    });

    expect(parsed.nodes).toHaveLength(2);
  });

  it("rejects a node with no parentId key at all — null must be explicit", () => {
    expect(WhyWhyTreePayloadSchema.safeParse({ nodes: [{ id: "a", text: "x" }] }).success).toBe(false);
  });

  it("keeps unknown keys on a node (D-51)", () => {
    const parsed = WhyWhyTreePayloadSchema.parse({
      nodes: [{ id: "a", parentId: null, text: "x", confidence: "high" }],
    });

    expect(parsed.nodes[0]).toMatchObject({ confidence: "high" });
  });

  it("accepts a node with no outcome at all — undefined means not yet decided (§2.2)", () => {
    const parsed = WhyWhyTreePayloadSchema.parse({ nodes: [{ id: "a", parentId: null, text: "x" }] });
    expect(parsed.nodes[0]?.outcome).toBeUndefined();
  });

  it("accepts both documented outcome values", () => {
    const parsed = WhyWhyTreePayloadSchema.parse({
      nodes: [
        { id: "a", parentId: null, text: "x", outcome: "controlled" },
        { id: "b", parentId: null, text: "y", outcome: "confirmedRootCause" },
      ],
    });
    expect(parsed.nodes[0]?.outcome).toBe("controlled");
    expect(parsed.nodes[1]?.outcome).toBe("confirmedRootCause");
  });

  it("keeps a future, undocumented outcome value instead of rejecting it — a loose string, not z.enum (D-51/D-116)", () => {
    const parsed = WhyWhyTreePayloadSchema.parse({
      nodes: [{ id: "a", parentId: null, text: "x", outcome: "escalated" }],
    });
    expect(parsed.nodes[0]?.outcome).toBe("escalated");
  });
});

describe("whyWhyTreeMethod", () => {
  it("belongs to Step 4 and holds no cross-step references", () => {
    expect(whyWhyTreeMethod.steps).toEqual([4]);
    expect(whyWhyTreeMethod.referenceRoles).toBeUndefined();
  });
});
