import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../i18n";
import { DistributionChartEditor } from "./Editor";
import type { DistributionChartPayload } from "./schema";

function Controlled({
  initial,
  onChange,
}: {
  initial: DistributionChartPayload;
  onChange: (p: DistributionChartPayload) => void;
}) {
  const [payload, setPayload] = useState(initial);
  return (
    <DistributionChartEditor
      payload={payload}
      onChange={(next) => {
        setPayload(next);
        onChange(next);
      }}
    />
  );
}

function emptyPayload(chartType: DistributionChartPayload["chartType"]): DistributionChartPayload {
  return { chartType, unit: "", binCount: "", samples: [], points: [] };
}

describe("DistributionChartEditor", () => {
  it("shows the sample-value row table and the bin-count field for a histogram", () => {
    render(<Controlled initial={emptyPayload("histogram")} onChange={vi.fn()} />);

    expect(screen.getByLabelText("Bin count")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Add row" })).toBeTruthy();
  });

  it("shows the x/y point row table for scatter, with no bin-count field", () => {
    render(<Controlled initial={emptyPayload("scatter")} onChange={vi.fn()} />);

    expect(screen.queryByLabelText("Bin count")).toBeNull();
    expect(screen.getByRole("button", { name: "Add row" })).toBeTruthy();
  });

  it("adds a sample row into the samples list, not the points list", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Controlled initial={emptyPayload("histogram")} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Add row" }));

    const next = onChange.mock.calls[onChange.mock.calls.length - 1]?.[0] as DistributionChartPayload;
    expect(next.samples).toHaveLength(1);
    expect(next.points).toHaveLength(0);
  });

  it("switches chartType via the select control", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Controlled initial={emptyPayload("histogram")} onChange={onChange} />);

    await user.click(screen.getByLabelText("Chart type"));
    await user.click(screen.getByRole("option", { name: "Box plot" }));

    const next = onChange.mock.calls[onChange.mock.calls.length - 1]?.[0] as DistributionChartPayload;
    expect(next.chartType).toBe("box-plot");
  });
});
