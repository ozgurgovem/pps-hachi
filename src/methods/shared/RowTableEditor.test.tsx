import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../i18n";
import { RowTableEditor } from "./RowTableEditor";
import type { RowTableColumn, RowTableRow } from "./rowTable";

type Key = "customer" | "date";

const COLUMNS = [
  { key: "customer", labelKey: "methods.vocComplaint.columns.customer", type: "text" },
  { key: "date", labelKey: "methods.vocComplaint.columns.date", type: "date" },
] as const satisfies readonly RowTableColumn<Key>[];

function row(id: string, customer: string): RowTableRow<Key> {
  return { id, customer, date: "" };
}

describe("RowTableEditor", () => {
  it("renders one field group per row, scoped by row", () => {
    render(<RowTableEditor idPrefix="voc" columns={COLUMNS} rows={[row("1", "Farplas")]} onChange={vi.fn()} />);
    expect((screen.getByLabelText("Customer") as HTMLInputElement).value).toBe("Farplas");
  });

  it("updates only the edited row's field, leaving other rows untouched", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <RowTableEditor
        idPrefix="voc"
        columns={COLUMNS}
        rows={[row("1", "Farplas"), row("2", "Bosch")]}
        onChange={onChange}
      />,
    );

    const inputs = screen.getAllByLabelText("Customer");
    await user.type(inputs[1]!, "X");

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as RowTableRow<Key>[];
    expect(lastCall[0]!.customer).toBe("Farplas");
    expect(lastCall[1]!.customer).toBe("BoschX");
  });

  it("adds a new blank row when Add row is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RowTableEditor idPrefix="voc" columns={COLUMNS} rows={[]} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Add row" }));

    const lastCall = onChange.mock.calls[0]![0] as RowTableRow<Key>[];
    expect(lastCall).toHaveLength(1);
    expect(lastCall[0]!.customer).toBe("");
  });

  it("removes the row whose remove button was clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <RowTableEditor
        idPrefix="voc"
        columns={COLUMNS}
        rows={[row("1", "Farplas"), row("2", "Bosch")]}
        onChange={onChange}
      />,
    );

    const removeButtons = screen.getAllByRole("button", { name: "Remove row" });
    await user.click(removeButtons[0]!);

    const lastCall = onChange.mock.calls[0]![0] as RowTableRow<Key>[];
    expect(lastCall).toEqual([row("2", "Bosch")]);
  });

  it("scopes each row's fields to its own container", () => {
    render(
      <RowTableEditor
        idPrefix="voc"
        columns={COLUMNS}
        rows={[row("1", "Farplas"), row("2", "Bosch")]}
        onChange={vi.fn()}
      />,
    );
    const removeButtons = screen.getAllByRole("button", { name: "Remove row" });
    const firstRowContainer = removeButtons[0]!.closest("div");
    expect((within(firstRowContainer!).getByLabelText("Customer") as HTMLInputElement).value).toBe("Farplas");
  });

  /**
   * A row persisted before a column existed (e.g. B1's §13.4 candidate 5
   * fields added to `hypothesisVerification`) is genuinely missing that key
   * at runtime — `Entry.payload` is never Zod-validated on load (D-52). The
   * field must render blank, not crash the editor.
   */
  it("renders a blank field, not a crash, for a row missing a column added after it was saved", () => {
    const legacyRow = { id: "1" } as unknown as RowTableRow<Key>;
    expect(() =>
      render(<RowTableEditor idPrefix="voc" columns={COLUMNS} rows={[legacyRow]} onChange={vi.fn()} />),
    ).not.toThrow();
    expect((screen.getByLabelText("Customer") as HTMLInputElement).value).toBe("");
  });
});
