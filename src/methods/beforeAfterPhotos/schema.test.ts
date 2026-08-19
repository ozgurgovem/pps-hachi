import { describe, expect, it } from "vitest";
import { beforeAfterPhotosMethod } from ".";
import { BeforeAfterPhotosPayloadSchema } from "./schema";

describe("BeforeAfterPhotosPayloadSchema", () => {
  it("accepts the empty payload the plugin creates", () => {
    expect(BeforeAfterPhotosPayloadSchema.safeParse(beforeAfterPhotosMethod.createEmptyPayload()).success).toBe(
      true,
    );
  });

  it("belongs to Step 6", () => {
    expect(beforeAfterPhotosMethod.steps).toEqual([6]);
  });

  it("declares two role-tagged photo slots, each capped at one image", () => {
    expect(beforeAfterPhotosMethod.imageSlots).toEqual([
      { role: "before", labelKey: "methods.beforeAfterPhotos.beforeLabel", max: 1 },
      { role: "after", labelKey: "methods.beforeAfterPhotos.afterLabel", max: 1 },
    ]);
  });
});
