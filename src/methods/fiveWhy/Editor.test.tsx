import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../i18n";
import { FiveWhyEditor } from "./Editor";
import type { FiveWhyPayload } from "./schema";

describe("FiveWhyEditor", () => {
  it("adds a new why step", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FiveWhyEditor payload={{ problemStatement: "", whys: [] }} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: /add why/i }));

    const next = onChange.mock.calls[0]![0] as FiveWhyPayload;
    expect(next.whys).toHaveLength(1);
  });

  it("removes a why step", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const payload: FiveWhyPayload = { problemStatement: "", whys: [{ id: "w1", answer: "Panel titreşiyor" }] };

    render(<FiveWhyEditor payload={payload} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: /remove why/i }));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ whys: [] }));
  });
});
