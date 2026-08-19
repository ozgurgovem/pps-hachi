import { describe, expect, it } from "vitest";
import { gembaObservationLogMethod } from ".";
import { GembaObservationLogPayloadSchema } from "./schema";

describe("GembaObservationLogPayloadSchema", () => {
  it("accepts the empty payload the plugin creates", () => {
    expect(GembaObservationLogPayloadSchema.safeParse(gembaObservationLogMethod.createEmptyPayload()).success).toBe(
      true,
    );
  });

  it("belongs to Step 2", () => {
    expect(gembaObservationLogMethod.steps).toEqual([2]);
  });

  it("declares one untagged photo slot capped at one image", () => {
    expect(gembaObservationLogMethod.imageSlots).toEqual([
      { labelKey: "methods.gembaObservationLog.photosLabel", max: 1 },
    ]);
  });
});
