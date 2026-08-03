import { describe, expect, it } from "vitest";
import { GapStatementPayloadSchema } from "./schema";

describe("GapStatementPayloadSchema", () => {
  it("accepts a fully-filled payload", () => {
    const result = GapStatementPayloadSchema.safeParse({
      ideal: "Zero leaks at final test",
      actual: "3 leaks per 1000 units",
      gap: "3 PPM above the ideal state",
    });
    expect(result.success).toBe(true);
  });

  it("accepts blank fields — drafting in progress is normal (D-52)", () => {
    const result = GapStatementPayloadSchema.safeParse({ ideal: "", actual: "", gap: "" });
    expect(result.success).toBe(true);
  });

  it("rejects a payload missing a required field entirely", () => {
    const result = GapStatementPayloadSchema.safeParse({ ideal: "" });
    expect(result.success).toBe(false);
  });
});
