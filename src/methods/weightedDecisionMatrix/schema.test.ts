import { describe, expect, it } from "vitest";
import { weightedDecisionMatrixMethod } from ".";
import { WeightedDecisionMatrixPayloadSchema } from "./schema";
import { rankOptions, scoreValue, weightedTotal } from "./score";

describe("WeightedDecisionMatrixPayloadSchema", () => {
  it("accepts the empty payload the plugin creates", () => {
    expect(WeightedDecisionMatrixPayloadSchema.safeParse(weightedDecisionMatrixMethod.createEmptyPayload()).success).toBe(
      true,
    );
  });

  it("rejects a numeric score", () => {
    expect(
      WeightedDecisionMatrixPayloadSchema.safeParse({
        criteria: [],
        options: [{ id: "o1", name: "x", scores: { c1: 3 } }],
      }).success,
    ).toBe(false);
  });
});

describe("scoreValue", () => {
  it("treats blank and non-numeric as unscored", () => {
    expect(scoreValue("")).toBeUndefined();
    expect(scoreValue("n/a")).toBeUndefined();
    expect(scoreValue(undefined)).toBeUndefined();
  });
});

describe("weightedTotal", () => {
  const criteria = [
    { id: "c1", name: "Cost", weight: "5" },
    { id: "c2", name: "Speed", weight: "2" },
  ];

  it("sums weight × score across criteria", () => {
    expect(weightedTotal({ id: "o1", name: "Option A", scores: { c1: "4", c2: "3" } }, criteria)).toBe(26);
  });

  it("ignores a criterion that no longer exists", () => {
    expect(weightedTotal({ id: "o1", name: "x", scores: { c1: "4", deleted: "10" } }, criteria)).toBe(20);
  });
});

describe("rankOptions", () => {
  it("orders by weighted total, highest first", () => {
    const criteria = [{ id: "c1", name: "Cost", weight: "5" }];
    const options = [
      { id: "a", name: "Low", scores: { c1: "1" } },
      { id: "b", name: "High", scores: { c1: "9" } },
    ];
    expect(rankOptions(options, criteria).map(({ option }) => option.name)).toEqual(["High", "Low"]);
  });
});
