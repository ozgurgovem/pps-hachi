import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../i18n";
import { ThreeLeggedFiveWhyEditor } from "./Editor";
import type { ThreeLeggedFiveWhyPayload } from "./schema";

function emptyPayload(): ThreeLeggedFiveWhyPayload {
  return { problemStatement: "", occurrence: [], detection: [], systemic: [] };
}

describe("ThreeLeggedFiveWhyEditor", () => {
  it("renders three independent why-chain legs", () => {
    render(<ThreeLeggedFiveWhyEditor payload={emptyPayload()} onChange={vi.fn()} />);
    expect(screen.getByText("Occurrence")).toBeTruthy();
    expect(screen.getByText("Detection")).toBeTruthy();
    expect(screen.getByText("Systemic")).toBeTruthy();
  });

  it("adding a why on one leg leaves the other two legs untouched", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const payload: ThreeLeggedFiveWhyPayload = {
      ...emptyPayload(),
      detection: [{ id: "d1", answer: "Test istasyonu algılamadı" }],
    };

    render(<ThreeLeggedFiveWhyEditor payload={payload} onChange={onChange} />);
    const [occurrenceAddWhy] = screen.getAllByRole("button", { name: /add why/i });
    await user.click(occurrenceAddWhy!);

    const next = onChange.mock.calls[0]![0] as ThreeLeggedFiveWhyPayload;
    expect(next.occurrence).toHaveLength(1);
    expect(next.detection).toEqual(payload.detection);
    expect(next.systemic).toEqual([]);
  });
});
