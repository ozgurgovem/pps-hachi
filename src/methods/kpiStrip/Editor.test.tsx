import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../i18n";
import { kpiStripMethod } from ".";
import { KpiStripEditor } from "./Editor";
import type { KpiStripItem, KpiStripPayload } from "./schema";

const EMPTY = kpiStripMethod.createEmptyPayload() as KpiStripPayload;

function oneItemPayload(): KpiStripPayload {
  const item: KpiStripItem = {
    id: "i1",
    label: "Çapak Fire Oranı",
    unit: "%",
    baseline: 4.2,
    target: 1.0,
    actual: 2.1,
    sustain: undefined,
    result: undefined,
    status: "inProgress",
  };
  return { items: [item] };
}

describe("KpiStripEditor", () => {
  it("renders no rows and an add-KPI button when empty", () => {
    render(<KpiStripEditor payload={EMPTY} onChange={vi.fn()} />);

    expect(screen.queryByLabelText("Metric")).toBeNull();
    expect(screen.getByRole("button", { name: "Add KPI" })).toBeTruthy();
  });

  it("adds a KPI item on add-KPI click", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<KpiStripEditor payload={EMPTY} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Add KPI" }));

    const next = onChange.mock.calls[onChange.mock.calls.length - 1]?.[0] as KpiStripPayload;
    expect(next.items).toHaveLength(1);
    expect(next.items[0]?.status).toBe("inProgress");
  });

  it("renders the item's fields, including the metric label", () => {
    render(<KpiStripEditor payload={oneItemPayload()} onChange={vi.fn()} />);

    expect((screen.getByLabelText("Metric") as HTMLInputElement).value).toBe("Çapak Fire Oranı");
    expect((screen.getByLabelText("Baseline (Önce)") as HTMLInputElement).value).toBe("4.2");
    expect((screen.getByLabelText("Target (Hedef)") as HTMLInputElement).value).toBe("1");
    expect((screen.getByLabelText("Actual (Sonra)") as HTMLInputElement).value).toBe("2.1");
  });

  it("writes the metric label back into the payload without touching other fields", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const payload = oneItemPayload();
    render(<KpiStripEditor payload={payload} onChange={onChange} />);

    await user.type(screen.getByLabelText("Metric"), "X");

    const next = onChange.mock.calls[onChange.mock.calls.length - 1]?.[0] as KpiStripPayload;
    expect(next.items[0]?.label).toBe("Çapak Fire OranıX");
    expect(next.items[0]?.baseline).toBe(4.2);
  });

  it("switches status via the select control", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<KpiStripEditor payload={oneItemPayload()} onChange={onChange} />);

    await user.click(screen.getByLabelText("Status"));
    await user.click(screen.getByRole("option", { name: "On target" }));

    const next = onChange.mock.calls[onChange.mock.calls.length - 1]?.[0] as KpiStripPayload;
    expect(next.items[0]?.status).toBe("onTarget");
  });

  it("clears an optional sustain/result field back to undefined when the input is emptied", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const payload: KpiStripPayload = { items: [{ ...oneItemPayload().items[0]!, sustain: 1.2 }] };
    render(<KpiStripEditor payload={payload} onChange={onChange} />);

    await user.clear(screen.getByLabelText("Sustain (Sürdürme)"));

    const next = onChange.mock.calls[onChange.mock.calls.length - 1]?.[0] as KpiStripPayload;
    expect(next.items[0]?.sustain).toBeUndefined();
  });

  it("removes an item on remove click", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<KpiStripEditor payload={oneItemPayload()} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Remove KPI" }));

    const next = onChange.mock.calls[onChange.mock.calls.length - 1]?.[0] as KpiStripPayload;
    expect(next.items).toHaveLength(0);
  });
});
