import { describe, expect, it } from "vitest";
import { faultTreeMethod } from ".";
import { FaultTreePayloadSchema } from "./schema";

describe("FaultTreePayloadSchema", () => {
  it("accepts the empty payload the plugin creates", () => {
    expect(FaultTreePayloadSchema.safeParse(faultTreeMethod.createEmptyPayload()).success).toBe(true);
  });

  it("accepts all three gates", () => {
    for (const gate of ["basic", "and", "or"]) {
      expect(FaultTreePayloadSchema.safeParse({ nodes: [{ id: "a", parentId: null, text: "x", gate }] }).success).toBe(
        true,
      );
    }
  });

  it("rejects a gate this build does not know", () => {
    expect(
      FaultTreePayloadSchema.safeParse({ nodes: [{ id: "a", parentId: null, text: "x", gate: "xor" }] }).success,
    ).toBe(false);
  });

  it("rejects a node with no gate — the logic is the point of an FTA", () => {
    expect(FaultTreePayloadSchema.safeParse({ nodes: [{ id: "a", parentId: null, text: "x" }] }).success).toBe(false);
  });
});

describe("faultTreeMethod", () => {
  it("belongs to Step 4 and holds no cross-step references", () => {
    expect(faultTreeMethod.steps).toEqual([4]);
    expect(faultTreeMethod.referenceRoles).toBeUndefined();
  });
});
