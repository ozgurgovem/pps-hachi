import { describe, expect, it } from "vitest";
import { newRowTableRow, rowTableLines, type RowTableColumn } from "./rowTable";

const COLUMNS = [
  { key: "customer", labelKey: "x.customer", type: "text" },
  { key: "claimNo", labelKey: "x.claimNo", type: "text" },
] as const satisfies readonly RowTableColumn<"customer" | "claimNo">[];

describe("newRowTableRow", () => {
  it("creates a row with a fresh id and every configured column blank", () => {
    const row = newRowTableRow(COLUMNS);
    expect(row.id.length).toBeGreaterThan(0);
    expect(row.customer).toBe("");
    expect(row.claimNo).toBe("");
  });

  it("gives two rows distinct ids", () => {
    const a = newRowTableRow(COLUMNS);
    const b = newRowTableRow(COLUMNS);
    expect(a.id).not.toBe(b.id);
  });
});

describe("rowTableLines", () => {
  it("joins each row's non-blank column values in configured order", () => {
    const lines = rowTableLines(
      [
        { id: "1", customer: "Farplas", claimNo: "C-100" },
        { id: "2", customer: "", claimNo: "C-200" },
      ],
      COLUMNS,
    );
    expect(lines).toEqual([{ text: "Farplas · C-100" }, { text: "C-200" }]);
  });

  it("drops rows where every column is blank", () => {
    const lines = rowTableLines([{ id: "1", customer: "", claimNo: "" }], COLUMNS);
    expect(lines).toEqual([]);
  });

  it("returns an empty array for no rows", () => {
    expect(rowTableLines([], COLUMNS)).toEqual([]);
  });
});
