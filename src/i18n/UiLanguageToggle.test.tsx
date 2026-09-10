import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import i18n from "./index";
import { UiLanguageToggle } from "./UiLanguageToggle";

describe("UiLanguageToggle", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  test("clicking Türkçe switches i18n.language to tr and persists it", async () => {
    const user = userEvent.setup();
    render(<UiLanguageToggle />);

    await user.click(screen.getByRole("button", { name: "Türkçe" }));

    expect(i18n.language).toBe("tr");
    expect(window.localStorage.getItem("pps-hachi:ui-language")).toBe("tr");
  });

  test("clicking English switches i18n.language back to en and persists it", async () => {
    await i18n.changeLanguage("tr");
    const user = userEvent.setup();
    render(<UiLanguageToggle />);

    await user.click(screen.getByRole("button", { name: "English" }));

    expect(i18n.language).toBe("en");
    expect(window.localStorage.getItem("pps-hachi:ui-language")).toBe("en");
  });

  test("the currently active language's button is aria-pressed", async () => {
    render(<UiLanguageToggle />);

    expect(screen.getByRole("button", { name: "English" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Türkçe" }).getAttribute("aria-pressed")).toBe("false");
  });
});
