import { describe, expect, it } from "vitest";
import { openItemsNextProblemMethod } from ".";
import { OpenItemsNextProblemPayloadSchema } from "./schema";

describe("OpenItemsNextProblemPayloadSchema", () => {
  it("accepts a payload with several logged items", () => {
    expect(
      OpenItemsNextProblemPayloadSchema.safeParse({
        rows: [{ id: "1", description: "Cavity 3 not yet retooled", owner: "Tooling", targetDate: "2026-09-01", status: "open" }],
      }).success,
    ).toBe(true);
  });

  it("accepts the empty payload the plugin creates", () => {
    expect(OpenItemsNextProblemPayloadSchema.safeParse(openItemsNextProblemMethod.createEmptyPayload()).success).toBe(true);
  });

  it("belongs to Step 8", () => {
    expect(openItemsNextProblemMethod.steps).toEqual([8]);
  });
});
