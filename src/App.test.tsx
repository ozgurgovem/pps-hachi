import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";
import "./i18n";

describe("App", () => {
  it("renders the scaffold placeholder from the i18next locale file", async () => {
    render(<App />);
    expect(await screen.findByText("Phase 0 scaffold — no product UI yet.")).toBeTruthy();
  });
});
