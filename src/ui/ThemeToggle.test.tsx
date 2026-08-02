import { afterEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "./theme/ThemeProvider";
import { ThemeToggle } from "./ThemeToggle";

describe("ThemeToggle", () => {
  afterEach(() => {
    window.localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  it("toggles [data-theme] on <html> and persists the choice", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );

    const initial = document.documentElement.dataset.theme;
    expect(initial === "light" || initial === "dark").toBe(true);

    await user.click(screen.getByRole("switch"));

    const toggled = document.documentElement.dataset.theme;
    expect(toggled).not.toBe(initial);
    expect(window.localStorage.getItem("pps-hachi:theme")).toBe(toggled);
  });
});
