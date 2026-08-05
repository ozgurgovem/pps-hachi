import { describe, expect, it } from "vitest";
import { ERROR_PROOFING_LEVELS, strengthOf } from "./levels";

describe("strengthOf", () => {
  it("ranks Eliminate as the strongest (1)", () => {
    expect(strengthOf("eliminate")).toBe(1);
  });

  it("ranks Procedure/Training as the weakest", () => {
    expect(strengthOf("procedure")).toBe(ERROR_PROOFING_LEVELS.length);
  });

  it("returns undefined for an unrecognized level", () => {
    expect(strengthOf("nonsense")).toBeUndefined();
  });
});
