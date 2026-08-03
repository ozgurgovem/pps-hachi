import { describe, expect, it } from "vitest";
import { FiveWhyPayloadSchema } from "./schema";

describe("FiveWhyPayloadSchema", () => {
  it("accepts a chain of why steps", () => {
    const result = FiveWhyPayloadSchema.safeParse({
      problemStatement: "Kapı paneli gürültü yapıyor.",
      whys: [
        { id: "w1", answer: "Panel titreşiyor" },
        { id: "w2", answer: "Klips gevşemiş" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects a why step missing its answer field", () => {
    const result = FiveWhyPayloadSchema.safeParse({
      problemStatement: "X",
      whys: [{ id: "w1" }],
    });
    expect(result.success).toBe(false);
  });
});
