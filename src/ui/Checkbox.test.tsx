import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Checkbox } from "./Checkbox";

describe("Checkbox", () => {
  it("starts unchecked and toggles to checked on click", async () => {
    const user = userEvent.setup();
    render(<Checkbox aria-label="Step 3 gate confirmed" />);

    const checkbox = screen.getByRole("checkbox", { name: "Step 3 gate confirmed" });
    expect(checkbox.getAttribute("aria-checked")).toBe("false");

    await user.click(checkbox);

    expect(checkbox.getAttribute("aria-checked")).toBe("true");
  });
});
