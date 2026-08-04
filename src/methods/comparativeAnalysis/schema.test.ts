import { describe, expect, it } from "vitest";
import { comparativeAnalysisMethod } from ".";
import { ComparativeAnalysisPayloadSchema } from "./schema";

describe("ComparativeAnalysisPayloadSchema", () => {
  it("accepts the empty payload the plugin creates", () => {
    expect(ComparativeAnalysisPayloadSchema.safeParse(comparativeAnalysisMethod.createEmptyPayload()).success).toBe(
      true,
    );
  });

  it("keeps every row field a string (D-120)", () => {
    const parsed = ComparativeAnalysisPayloadSchema.parse({
      subject: "Cavity 2 vs cavity 4",
      rows: [{ id: "r1", characteristic: "Wall thickness", goodCase: "2.1", badCase: "1.8", difference: "-0.3" }],
    });

    expect(parsed.rows[0]?.goodCase).toBe("2.1");
  });

  it("rejects a payload with no subject field", () => {
    expect(ComparativeAnalysisPayloadSchema.safeParse({ rows: [] }).success).toBe(false);
  });
});

describe("comparativeAnalysisMethod", () => {
  it("belongs to Step 4 and holds no cross-step references", () => {
    expect(comparativeAnalysisMethod.steps).toEqual([4]);
    expect(comparativeAnalysisMethod.referenceRoles).toBeUndefined();
  });
});
