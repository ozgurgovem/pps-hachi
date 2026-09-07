import { afterEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import i18next from "../../../i18n";
import { StepPage } from "./StepPage";

afterEach(async () => {
  await i18next.changeLanguage("en");
});

describe("StepPage title", () => {
  it("renders 'Step-N. Name' upper-cased in English", () => {
    render(<StepPage stepId={4} advisory={null} onDismissAdvisory={() => {}} />);

    expect(screen.getByRole("heading", { name: "STEP-4. ROOT CAUSE ANALYSIS" })).toBeTruthy();
  });

  it(
    "upper-cases Turkish with a locale-aware transform — 'İ', not a bare 'I' (CLAUDE.md's own " +
      "Turkish-character warning)",
    async () => {
      await i18next.changeLanguage("tr");

      render(<StepPage stepId={4} advisory={null} onDismissAdvisory={() => {}} />);

      // Plain `.toUpperCase()` would produce "ADIM-4. KÖK NEDEN ANALIZI" (no
      // dot on the final I) — the locale-aware form must keep "ANALİZİ".
      expect(screen.getByRole("heading", { name: "ADIM-4. KÖK NEDEN ANALİZİ" })).toBeTruthy();
      expect(screen.queryByRole("heading", { name: "ADIM-4. KÖK NEDEN ANALIZI" })).toBeFalsy();
    },
  );
});
