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
});
