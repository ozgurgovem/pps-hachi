import { describe, expect, it } from "vitest";
import { spaghettiDiagramMethod } from ".";
import { SpaghettiDiagramPayloadSchema } from "./schema";

describe("SpaghettiDiagramPayloadSchema", () => {
  it("accepts the empty payload the plugin creates", () => {
    expect(SpaghettiDiagramPayloadSchema.safeParse(spaghettiDiagramMethod.createEmptyPayload()).success).toBe(true);
  });

  it("belongs to Step 2", () => {
    expect(spaghettiDiagramMethod.steps).toEqual([2]);
  });

  it("declares one annotatable photo slot capped at one image", () => {
    expect(spaghettiDiagramMethod.imageSlots).toEqual([
      { labelKey: "methods.spaghettiDiagram.photoLabel", max: 1, annotatable: true },
    ]);
  });

  it("declares no imageKind/renderImage of its own — reuses the shared annotated-photo renderer", () => {
    expect(spaghettiDiagramMethod.imageKind).toBeUndefined();
    expect(spaghettiDiagramMethod.renderImage).toBeUndefined();
  });
});
