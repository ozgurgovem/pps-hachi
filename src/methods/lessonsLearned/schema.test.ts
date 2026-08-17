import { describe, expect, it } from "vitest";
import { lessonsLearnedMethod } from ".";
import { LessonsLearnedPayloadSchema } from "./schema";

describe("LessonsLearnedPayloadSchema", () => {
  it("accepts the empty payload the plugin creates", () => {
    expect(LessonsLearnedPayloadSchema.safeParse(lessonsLearnedMethod.createEmptyPayload()).success).toBe(true);
  });

  it("belongs to Step 8", () => {
    expect(lessonsLearnedMethod.steps).toEqual([8]);
  });

  it("rejects a payload missing a question entirely", () => {
    const result = LessonsLearnedPayloadSchema.safeParse({ wentWell: "Faster containment this time" });
    expect(result.success).toBe(false);
  });
});
