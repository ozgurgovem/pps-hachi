import { describe, expect, it } from "vitest";
import { ProblemTypeClassifierPayloadSchema } from "./schema";

describe("ProblemTypeClassifierPayloadSchema", () => {
  it("accepts a valid classification with a note", () => {
    const result = ProblemTypeClassifierPayloadSchema.safeParse({
      classification: "belowStandard",
      note: "Yield dropped below the historical baseline.",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a blank note — drafting in progress is normal (D-52)", () => {
    const result = ProblemTypeClassifierPayloadSchema.safeParse({ classification: "raiseTheStandard", note: "" });
    expect(result.success).toBe(true);
  });

  it("rejects a classification outside the fixed set", () => {
    const result = ProblemTypeClassifierPayloadSchema.safeParse({ classification: "unknown", note: "" });
    expect(result.success).toBe(false);
  });
});
