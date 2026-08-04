import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../i18n";
import { countermeasureMethod } from ".";
import { CountermeasureEditor } from "./Editor";
import type { CountermeasurePayload } from "./schema";

const EMPTY = countermeasureMethod.createEmptyPayload() as CountermeasurePayload;

describe("CountermeasureEditor", () => {
  it("renders the countermeasure's own fields", () => {
    render(<CountermeasureEditor payload={EMPTY} onChange={vi.fn()} />);

    for (const label of ["Countermeasure", "Expected effect", "Owner", "Target date", "Status"]) {
      expect(screen.getByLabelText(label)).toBeTruthy();
    }
  });

  it("writes the description back into the payload", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CountermeasureEditor payload={EMPTY} onChange={onChange} />);

    await user.type(screen.getByLabelText("Countermeasure"), "P");

    expect(onChange).toHaveBeenCalledWith({ ...EMPTY, description: "P" });
  });

  it("leaves the root-cause links to the dialog's generic picker (D-116)", () => {
    render(<CountermeasureEditor payload={EMPTY} onChange={vi.fn()} />);

    expect(screen.queryByText("Root causes addressed")).toBeNull();
  });
});
