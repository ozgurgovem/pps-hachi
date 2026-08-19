import { describe, expect, it } from "vitest";
import type { Round } from "../model";
import { findOpenRound, roundOrdinal } from "./rounds";

const CLOSED: Round = {
  id: "r1",
  openedAt: "2026-08-01T00:00:00.000Z",
  closedAt: "2026-08-05T00:00:00.000Z",
  reason: "first",
};
const OPEN: Round = { id: "r2", openedAt: "2026-08-10T00:00:00.000Z", reason: "second" };

describe("roundOrdinal", () => {
  it("returns the 1-based position of a round in the array", () => {
    expect(roundOrdinal([CLOSED, OPEN], "r1")).toBe(1);
    expect(roundOrdinal([CLOSED, OPEN], "r2")).toBe(2);
  });

  it("returns undefined for an id not present", () => {
    expect(roundOrdinal([CLOSED], "missing")).toBeUndefined();
  });
});

describe("findOpenRound", () => {
  it("returns the round with no closedAt", () => {
    expect(findOpenRound([CLOSED, OPEN])).toEqual(OPEN);
  });

  it("returns undefined when every round is closed", () => {
    expect(findOpenRound([CLOSED])).toBeUndefined();
  });

  it("returns undefined for an empty list", () => {
    expect(findOpenRound([])).toBeUndefined();
  });
});
