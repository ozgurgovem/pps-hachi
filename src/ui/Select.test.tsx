import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SelectContent, SelectItem, SelectRoot, SelectTrigger, SelectValue } from "./Select";

function renderSelect() {
  return render(
    <SelectRoot>
      <SelectTrigger>
        <SelectValue placeholder="Choose a template" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="farplas-7step-tr">Farplas 7-step (TR)</SelectItem>
        <SelectItem value="pps-8step-auto">PPS 8-step (auto)</SelectItem>
      </SelectContent>
    </SelectRoot>,
  );
}

describe("Select", () => {
  it("shows the placeholder, then the chosen item's label after selection", async () => {
    const user = userEvent.setup();
    renderSelect();

    expect(screen.getByText("Choose a template")).toBeTruthy();

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "PPS 8-step (auto)" }));

    expect(screen.getByRole("combobox").textContent).toContain("PPS 8-step (auto)");
  });

  // Real gap found in Barış's own first trial run (2026-09-10): a dropdown
  // with many items (dozens of real Vorion-listed models) had no height
  // cap and spilled off-screen with nothing to scroll it into view — see
  // Select.tsx's own comment on `SelectContent` for the full root cause.
  it("caps the open listbox's own height so a long item list can scroll instead of spilling off-screen", async () => {
    const user = userEvent.setup();
    render(
      <SelectRoot>
        <SelectTrigger>
          <SelectValue placeholder="Choose a model" />
        </SelectTrigger>
        <SelectContent>
          {Array.from({ length: 40 }, (_, index) => (
            <SelectItem key={index} value={`model-${index}`}>
              {`Model ${index}`}
            </SelectItem>
          ))}
        </SelectContent>
      </SelectRoot>,
    );

    await user.click(screen.getByRole("combobox"));
    const listbox = await screen.findByRole("listbox");

    expect(listbox.className).toContain("max-h-[var(--radix-select-content-available-height)]");
  });
});
