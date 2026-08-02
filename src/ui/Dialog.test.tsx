import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DialogContent, DialogRoot, DialogTrigger } from "./Dialog";

describe("Dialog", () => {
  it("is closed until the trigger is clicked, then shows title and description", async () => {
    const user = userEvent.setup();
    render(
      <DialogRoot>
        <DialogTrigger>Open dialog</DialogTrigger>
        <DialogContent title="Example dialog" description="Explains what this dialog is for.">
          <p>Body content</p>
        </DialogContent>
      </DialogRoot>,
    );

    expect(screen.queryByRole("dialog")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Open dialog" }));

    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Example dialog")).toBeTruthy();
    expect(screen.getByText("Explains what this dialog is for.")).toBeTruthy();
  });
});
