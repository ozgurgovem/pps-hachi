import { describe, expect, it } from "vitest";
import { FishbonePayloadSchema } from "./schema";

describe("FishbonePayloadSchema", () => {
  it("accepts a valid payload with a top-level cause and a sub-cause", () => {
    const result = FishbonePayloadSchema.safeParse({
      categorySet: "4M",
      causes: [
        { id: "c1", categoryId: "machine", text: "Aşınmış kalıp" },
        { id: "c2", categoryId: "machine", parentCauseId: "c1", text: "Bakım gecikmesi", position: { x: 1, y: 2 } },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown categorySet", () => {
    const result = FishbonePayloadSchema.safeParse({ categorySet: "7M", causes: [] });
    expect(result.success).toBe(false);
  });

  it("preserves unknown keys instead of stripping them — D-51", () => {
    const parsed = FishbonePayloadSchema.parse({
      categorySet: "6M",
      causes: [],
      futureField: "should survive a round-trip",
    });
    expect(parsed).toMatchObject({ futureField: "should survive a round-trip" });
  });
});
