import { describe, expect, it } from "vitest";
import { valueStreamMapMethod } from ".";
import { ValueStreamMapPayloadSchema } from "./schema";

describe("ValueStreamMapPayloadSchema", () => {
  it("accepts the empty payload the plugin creates", () => {
    expect(ValueStreamMapPayloadSchema.safeParse(valueStreamMapMethod.createEmptyPayload()).success).toBe(true);
  });

  it("belongs to Step 2", () => {
    expect(valueStreamMapMethod.steps).toEqual([2]);
  });

  it("declares one annotatable photo slot capped at one image", () => {
    expect(valueStreamMapMethod.imageSlots).toEqual([
      { labelKey: "methods.valueStreamMap.photoLabel", max: 1, annotatable: true },
    ]);
  });

  it("declares no imageKind/renderImage of its own — reuses the shared annotated-photo renderer", () => {
    expect(valueStreamMapMethod.imageKind).toBeUndefined();
    expect(valueStreamMapMethod.renderImage).toBeUndefined();
  });
});
