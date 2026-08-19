import { describe, expect, it } from "vitest";
import { priorityScoreOf } from "./priorityScore";

describe("priorityScoreOf", () => {
  it("multiplies impact, cost-favorability and duration-favorability", () => {
    expect(priorityScoreOf({ impactScore: "5", costScore: "4", durationScore: "4" })).toBe(80);
    expect(priorityScoreOf({ impactScore: "5", costScore: "5", durationScore: "5" })).toBe(125);
  });

  it("scores a high-impact-but-impractical countermeasure low, not high", () => {
    // Mold modification: high impact but expensive and slow (1/5 favorability on both).
    expect(priorityScoreOf({ impactScore: "5", costScore: "1", durationScore: "1" })).toBe(5);
  });

  it("is undefined, not zero, when any of the three is blank", () => {
    expect(priorityScoreOf({ impactScore: "", costScore: "4", durationScore: "4" })).toBeUndefined();
    expect(priorityScoreOf({ impactScore: "5", costScore: "", durationScore: "4" })).toBeUndefined();
    expect(priorityScoreOf({ impactScore: "5", costScore: "4", durationScore: "" })).toBeUndefined();
  });

  it("is undefined when a score is non-numeric", () => {
    expect(priorityScoreOf({ impactScore: "high", costScore: "4", durationScore: "4" })).toBeUndefined();
  });

  it("treats whitespace-only scores as blank", () => {
    expect(priorityScoreOf({ impactScore: "5", costScore: "   ", durationScore: "4" })).toBeUndefined();
  });
});
