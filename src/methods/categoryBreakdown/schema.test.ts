import { describe, expect, it } from "vitest";
import { categoryBreakdownMethod } from ".";
import { CategoryBreakdownPayloadSchema } from "./schema";

describe("CategoryBreakdownPayloadSchema", () => {
  it("accepts the empty payload the plugin creates", () => {
    expect(CategoryBreakdownPayloadSchema.safeParse(categoryBreakdownMethod.createEmptyPayload()).success).toBe(
      true,
    );
  });

  it("accepts a category this build does not know (D-51 loose-by-default)", () => {
    const parsed = CategoryBreakdownPayloadSchema.parse({
      rows: [{ id: "r1", category: "environment", subProblem: "x", effect: "y" }],
    });

    expect(parsed.rows[0]?.category).toBe("environment");
  });

  it("keeps unknown keys on a row (D-51)", () => {
    const parsed = CategoryBreakdownPayloadSchema.parse({
      rows: [{ id: "r1", category: "man", subProblem: "", effect: "", severity: "high" }],
    });

    expect(parsed.rows[0]).toMatchObject({ severity: "high" });
  });
});

describe("categoryBreakdownMethod", () => {
  it("belongs to Step 2 only — never Step 4, which stays Fishbone's per D-11", () => {
    expect(categoryBreakdownMethod.steps).toEqual([2]);
  });

  it("declares no cross-step reference roles", () => {
    expect(categoryBreakdownMethod.referenceRoles).toBeUndefined();
  });
});
