import { describe, expect, it } from "vitest";
import { IsIsNotPayloadSchema } from "./schema";

describe("IsIsNotPayloadSchema", () => {
  it("accepts a fully-filled payload", () => {
    const result = IsIsNotPayloadSchema.safeParse({
      whatIs: "Gürültü",
      whatIsNot: "Titreşim",
      whereIs: "Hat 3",
      whereIsNot: "Hat 1",
      whenIs: "Vardiya 2",
      whenIsNot: "Vardiya 1",
      extentIs: "40 adet/gün",
      extentIsNot: "Tüm hat",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a payload missing a required dimension", () => {
    const result = IsIsNotPayloadSchema.safeParse({ whatIs: "Gürültü" });
    expect(result.success).toBe(false);
  });
});
