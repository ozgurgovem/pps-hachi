import { describe, expect, it } from "vitest";
import { defectPhotoBoardMethod } from ".";
import { DefectPhotoBoardPayloadSchema } from "./schema";

describe("DefectPhotoBoardPayloadSchema", () => {
  it("accepts the empty payload the plugin creates", () => {
    expect(DefectPhotoBoardPayloadSchema.safeParse(defectPhotoBoardMethod.createEmptyPayload()).success).toBe(true);
  });

  it("belongs to Step 1", () => {
    expect(defectPhotoBoardMethod.steps).toEqual([1]);
  });

  it("declares one annotatable photo slot capped at one image", () => {
    expect(defectPhotoBoardMethod.imageSlots).toEqual([
      { labelKey: "methods.defectPhotoBoard.photoLabel", max: 1, annotatable: true },
    ]);
  });

  it("registers the shared annotated-photo renderer", () => {
    expect(defectPhotoBoardMethod.imageKind).toBe("annotated-photo");
    expect(typeof defectPhotoBoardMethod.renderImage).toBe("function");
  });
});
