import { describe, expect, it } from "vitest";
import { FiveN1KPayloadSchema } from "./schema";

describe("FiveN1KPayloadSchema", () => {
  it("accepts a fully-filled payload", () => {
    const result = FiveN1KPayloadSchema.safeParse({
      ne: "Gürültü",
      neden: "Panel rezonansı",
      nasil: "Sürüş sırasında duyuluyor",
      kim: "Ayşe Yılmaz",
      neZaman: "Vardiya 2",
      nerede: "Hat 3, istasyon 12",
    });
    expect(result.success).toBe(true);
  });

  it("accepts blank fields — drafting in progress is normal (D-52)", () => {
    const result = FiveN1KPayloadSchema.safeParse({
      ne: "",
      neden: "",
      nasil: "",
      kim: "",
      neZaman: "",
      nerede: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a payload missing a required field entirely", () => {
    const result = FiveN1KPayloadSchema.safeParse({ ne: "" });
    expect(result.success).toBe(false);
  });
});
