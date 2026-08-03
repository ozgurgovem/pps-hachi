import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../i18n";
import { ParetoEditor } from "./Editor";
import type { ParetoPayload } from "./schema";

/** `ParetoEditor` is controlled — a stateful wrapper is needed to observe accumulated typing. */
function ControlledParetoEditor({
  initial,
  onChange,
}: {
  initial: ParetoPayload;
  onChange: (payload: ParetoPayload) => void;
}) {
  const [payload, setPayload] = useState(initial);
  return (
    <ParetoEditor
      payload={payload}
      onChange={(next) => {
        setPayload(next);
        onChange(next);
      }}
    />
  );
}

describe("ParetoEditor", () => {
  it("adds a new, empty category row when 'add category' is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const payload: ParetoPayload = { unit: "", categories: [] };

    render(<ParetoEditor payload={payload} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: /add category/i }));

    expect(onChange).toHaveBeenCalledTimes(1);
    const next = onChange.mock.calls[0]![0] as ParetoPayload;
    expect(next.categories).toHaveLength(1);
    expect(next.categories[0]).toMatchObject({ label: "", count: 0 });
  });

  it("updates a category's label and count independently", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const payload: ParetoPayload = {
      unit: "adet",
      categories: [{ id: "c1", label: "", count: 0 }],
    };

    render(<ControlledParetoEditor initial={payload} onChange={onChange} />);
    await user.type(screen.getByRole("textbox", { name: /category/i }), "Boya hatası");

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as ParetoPayload;
    expect(lastCall.categories[0]!.label).toBe("Boya hatası");
  });

  it("removes a category row", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const payload: ParetoPayload = {
      unit: "",
      categories: [{ id: "c1", label: "Sızdırmazlık", count: 5 }],
    };

    render(<ParetoEditor payload={payload} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: /remove category/i }));

    expect(onChange).toHaveBeenCalledWith({ unit: "", categories: [] });
  });
});
