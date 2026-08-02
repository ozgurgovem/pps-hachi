import { describe, expect, it } from "vitest";
import { columnLetterToIndex, parseCellRef, parseRange } from "./cellRef";

describe("cellRef", () => {
  it("parses a simple reference", () => {
    expect(parseCellRef("B8")).toEqual({ column: "B", row: 8 });
  });

  it("parses a two-letter column reference", () => {
    expect(parseCellRef("AB59")).toEqual({ column: "AB", row: 59 });
  });

  it("converts single-letter columns to a 0-based index", () => {
    expect(columnLetterToIndex("A")).toBe(0);
    expect(columnLetterToIndex("B")).toBe(1);
    expect(columnLetterToIndex("Z")).toBe(25);
  });

  it("converts two-letter columns to a 0-based index", () => {
    expect(columnLetterToIndex("AA")).toBe(26);
    expect(columnLetterToIndex("AB")).toBe(27);
    expect(columnLetterToIndex("AC")).toBe(28);
  });

  it("parses a range into start/end refs", () => {
    expect(parseRange("B2:C3")).toEqual({
      start: { column: "B", row: 2 },
      end: { column: "C", row: 3 },
    });
  });

  it("treats a single-cell range as start === end", () => {
    expect(parseRange("AB59")).toEqual({
      start: { column: "AB", row: 59 },
      end: { column: "AB", row: 59 },
    });
  });
});
