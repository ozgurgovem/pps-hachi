import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "./Input";

describe("Input", () => {
  it("accepts typed input", async () => {
    const user = userEvent.setup();
    render(<Input aria-label="Part number" />);

    const input = screen.getByRole("textbox", { name: "Part number" });
    await user.type(input, "32-4471");

    expect((input as HTMLInputElement).value).toBe("32-4471");
  });
});
