import { describe, expect, it } from "vitest";
import { causeEffectMatrixMethod } from ".";
import { CauseEffectMatrixPayloadSchema } from "./schema";
import { rankInputs, scoreValue, weightedTotal } from "./score";

describe("CauseEffectMatrixPayloadSchema", () => {
  it("accepts the empty payload the plugin creates", () => {
    expect(CauseEffectMatrixPayloadSchema.safeParse(causeEffectMatrixMethod.createEmptyPayload()).success).toBe(true);
  });

  it("stores scores as strings keyed by output id (D-120)", () => {
    const parsed = CauseEffectMatrixPayloadSchema.parse({
      outputs: [{ id: "o1", name: "Scrap", weight: "9" }],
      inputs: [{ id: "i1", name: "Melt temp", scores: { o1: "3" } }],
    });

    expect(parsed.inputs[0]?.scores).toEqual({ o1: "3" });
  });

  it("rejects a numeric score — the schema stays string-typed so a half-typed value round-trips", () => {
    expect(
      CauseEffectMatrixPayloadSchema.safeParse({
        outputs: [],
        inputs: [{ id: "i1", name: "x", scores: { o1: 3 } }],
      }).success,
    ).toBe(false);
  });
});

describe("scoreValue", () => {
  it("reads a number", () => {
    expect(scoreValue("9")).toBe(9);
  });

  it("treats blank, whitespace and non-numeric text as unscored rather than zero", () => {
    expect(scoreValue("")).toBeUndefined();
    expect(scoreValue("   ")).toBeUndefined();
    expect(scoreValue("high")).toBeUndefined();
    expect(scoreValue(undefined)).toBeUndefined();
  });
});

describe("weightedTotal", () => {
  const outputs = [
    { id: "o1", name: "Scrap", weight: "9" },
    { id: "o2", name: "Downtime", weight: "3" },
  ];

  it("sums weight × score across outputs", () => {
    expect(weightedTotal({ id: "i1", name: "Melt temp", scores: { o1: "3", o2: "1" } }, outputs)).toBe(30);
  });

  it("ignores a cell that was never scored", () => {
    expect(weightedTotal({ id: "i1", name: "x", scores: { o1: "3" } }, outputs)).toBe(27);
  });

  /** D-117's derive-don't-store posture: a deleted output leaves a stale key that must not count. */
  it("ignores scores keyed to an output that no longer exists", () => {
    expect(weightedTotal({ id: "i1", name: "x", scores: { o1: "3", deleted: "10" } }, outputs)).toBe(27);
  });
});

describe("rankInputs", () => {
  it("orders by weighted total, highest first", () => {
    const outputs = [{ id: "o1", name: "Scrap", weight: "5" }];
    const inputs = [
      { id: "a", name: "Low", scores: { o1: "1" } },
      { id: "b", name: "High", scores: { o1: "9" } },
    ];

    expect(rankInputs(inputs, outputs).map(({ input }) => input.name)).toEqual(["High", "Low"]);
  });
});
