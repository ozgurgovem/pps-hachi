import { describe, expect, it } from "vitest";
import { FiveG5N1KPayloadSchema } from "./schema";

describe("FiveG5N1KPayloadSchema", () => {
  it("accepts a fully-filled payload", () => {
    const result = FiveG5N1KPayloadSchema.safeParse({
      gemba: "Hat 3",
      gembutsu: "Kapı paneli",
      genjitsu: "Gürültü 4kHz bandında",
      genri: "Panel rezonansı",
      gensoku: "Tolerans ±0.2mm",
      ne: "Gürültü",
      nerede: "Hat 3, istasyon 12",
      nasil: "Sürüş sırasında",
      neZaman: "Vardiya 2",
      neKadar: "Günde 40 adet",
      kim: "Ayşe Yılmaz",
    });
    expect(result.success).toBe(true);
  });

  it("accepts blank fields — drafting in progress is normal (D-52)", () => {
    const result = FiveG5N1KPayloadSchema.safeParse({
      gemba: "",
      gembutsu: "",
      genjitsu: "",
      genri: "",
      gensoku: "",
      ne: "",
      nerede: "",
      nasil: "",
      neZaman: "",
      neKadar: "",
      kim: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a payload missing a required field entirely", () => {
    const result = FiveG5N1KPayloadSchema.safeParse({ gemba: "" });
    expect(result.success).toBe(false);
  });
});
