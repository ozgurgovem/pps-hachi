import { describe, expect, it } from "vitest";
import { quadrantOf, scoreValue } from "./quadrant";

describe("scoreValue", () => {
  it("treats blank and non-numeric text as unscored", () => {
    expect(scoreValue("")).toBeUndefined();
    expect(scoreValue("   ")).toBeUndefined();
    expect(scoreValue("high")).toBeUndefined();
  });

  it("reads a number", () => {
    expect(scoreValue("4")).toBe(4);
  });
});

describe("quadrantOf", () => {
  it("is undefined when impact or effort is unscored", () => {
    expect(quadrantOf({ id: "1", description: "x", impact: "", effort: "1" })).toBeUndefined();
    expect(quadrantOf({ id: "1", description: "x", impact: "4", effort: "" })).toBeUndefined();
  });

  it("classifies high impact + low effort as a quick win", () => {
    expect(quadrantOf({ id: "1", description: "x", impact: "5", effort: "1" })).toBe("quick-win");
  });

  it("classifies high impact + high effort as a major project", () => {
    expect(quadrantOf({ id: "1", description: "x", impact: "4", effort: "4" })).toBe("major-project");
  });

  it("classifies low impact + low effort as a fill-in", () => {
    expect(quadrantOf({ id: "1", description: "x", impact: "1", effort: "2" })).toBe("fill-in");
  });

  it("classifies low impact + high effort as a thankless task", () => {
    expect(quadrantOf({ id: "1", description: "x", impact: "1", effort: "5" })).toBe("thankless-task");
  });

  it("splits the 1–5 scale at 3 for impact and at 2/3 for effort", () => {
    expect(quadrantOf({ id: "1", description: "x", impact: "3", effort: "2" })).toBe("quick-win");
    expect(quadrantOf({ id: "1", description: "x", impact: "3", effort: "3" })).toBe("major-project");
  });
});
