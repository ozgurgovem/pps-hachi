import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Textarea } from "./Textarea";

describe("Textarea", () => {
  it("accepts typed input", async () => {
    const user = userEvent.setup();
    render(<Textarea aria-label="Notes" />);

    const textarea = screen.getByRole("textbox", { name: "Notes" });
    await user.type(textarea, "Point of cause is on line 3.");

    expect((textarea as HTMLTextAreaElement).value).toBe("Point of cause is on line 3.");
  });
});
