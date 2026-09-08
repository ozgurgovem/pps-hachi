import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../../i18n";
import { A3PreviewReservedBand } from "./A3PreviewReservedBand";

const openOrFocusA3PreviewWindow = vi.fn();
vi.mock("../a3PreviewWindow/window", () => ({
  openOrFocusA3PreviewWindow: (...args: unknown[]) => openOrFocusA3PreviewWindow(...args),
}));

describe("A3PreviewReservedBand", () => {
  it("reserves the space with a coming-soon badge, and offers the full A3 preview as an escape hatch", async () => {
    const user = userEvent.setup();
    render(<A3PreviewReservedBand />);

    expect(screen.getByText("Coming soon")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "A3 Preview" }));

    expect(openOrFocusA3PreviewWindow).toHaveBeenCalledOnce();
  });
});
