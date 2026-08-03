import { describe, expect, it } from "vitest";
import { ThreeLeggedFiveWhyPayloadSchema } from "./schema";

describe("ThreeLeggedFiveWhyPayloadSchema", () => {
  it("accepts three independent why chains", () => {
    const result = ThreeLeggedFiveWhyPayloadSchema.safeParse({
      problemStatement: "Müşteri şikayeti: gürültü.",
      occurrence: [{ id: "o1", answer: "Panel titreşiyor" }],
      detection: [{ id: "d1", answer: "Test istasyonu gürültüyü algılamadı" }],
      systemic: [{ id: "s1", answer: "Kontrol planı güncellenmemiş" }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty chains — drafting in progress is normal", () => {
    const result = ThreeLeggedFiveWhyPayloadSchema.safeParse({
      problemStatement: "",
      occurrence: [],
      detection: [],
      systemic: [],
    });
    expect(result.success).toBe(true);
  });

  it("rejects a payload missing the systemic leg entirely", () => {
    const result = ThreeLeggedFiveWhyPayloadSchema.safeParse({
      problemStatement: "",
      occurrence: [],
      detection: [],
    });
    expect(result.success).toBe(false);
  });
});
