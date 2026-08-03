import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../i18n";
import { TrendEditor } from "./Editor";
import type { TrendPayload } from "./schema";

describe("TrendEditor", () => {
  it("adds a new, empty point row when 'add point' is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const payload: TrendPayload = { unit: "", points: [], events: [] };

    render(<TrendEditor payload={payload} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: /add point/i }));

    const next = onChange.mock.calls[0]![0] as TrendPayload;
    expect(next.points).toHaveLength(1);
    expect(next.points[0]).toMatchObject({ label: "", value: 0 });
  });

  it("removes a point row", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const payload: TrendPayload = { unit: "", points: [{ id: "p1", label: "Hafta 1", value: 10 }], events: [] };

    render(<TrendEditor payload={payload} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: /remove point/i }));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ points: [] }));
  });

  it("adds an event row defaulting 'at' to the first point's label", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const payload: TrendPayload = { unit: "", points: [{ id: "p1", label: "Hafta 1", value: 10 }], events: [] };

    render(<TrendEditor payload={payload} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: /add event/i }));

    const next = onChange.mock.calls[0]![0] as TrendPayload;
    expect(next.events).toEqual([{ label: "", at: "Hafta 1" }]);
  });
});
