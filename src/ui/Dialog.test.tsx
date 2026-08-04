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

  /**
   * Found walking the real app with Fishbone's growing cause list (Anayasa
   * §3b — no dialog's content had ever been tall enough to hit this): with
   * no height cap, a tall body pushes the title above the viewport and
   * Save/Cancel below it, with no scrollbar to reach either. The body must
   * be the thing that scrolls; the title must stay put.
   */
  it("caps its own height and keeps the title fixed while only the body scrolls", async () => {
    const user = userEvent.setup();
    render(
      <DialogRoot>
        <DialogTrigger>Open dialog</DialogTrigger>
        <DialogContent title="Tall dialog">
          <p style={{ height: "4000px" }}>Very tall body</p>
        </DialogContent>
      </DialogRoot>,
    );

    await user.click(screen.getByRole("button", { name: "Open dialog" }));

    const dialog = screen.getByRole("dialog");
    expect(dialog.className).toMatch(/max-h-\[85vh\]/);
    const title = screen.getByText("Tall dialog");
    expect(title.className).toMatch(/shrink-0/);
    const body = screen.getByText("Very tall body").parentElement;
    expect(body?.className).toMatch(/overflow-y-auto/);
  });
});
