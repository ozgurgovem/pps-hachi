import { describe, expect, it } from "vitest";
import { FiveW2HPayloadSchema } from "./schema";

describe("FiveW2HPayloadSchema", () => {
  it("accepts a fully-filled payload", () => {
    const result = FiveW2HPayloadSchema.safeParse({
      what: "Noise",
      where: "Line 3, station 12",
      when: "Shift 2",
      who: "Ayşe Yılmaz",
      which: "Door panel",
      how: "During drive",
      howMuch: "40 units/day",
    });
    expect(result.success).toBe(true);
  });

  it("accepts blank fields — drafting in progress is normal (D-52)", () => {
    const result = FiveW2HPayloadSchema.safeParse({
      what: "",
      where: "",
      when: "",
      who: "",
      which: "",
      how: "",
      howMuch: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a payload missing a required field entirely", () => {
    const result = FiveW2HPayloadSchema.safeParse({ what: "" });
    expect(result.success).toBe(false);
  });
});
