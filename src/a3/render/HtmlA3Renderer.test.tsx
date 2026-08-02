import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { buildA3Layout } from "../buildA3Layout";
import type { A3EntryRendererMap } from "../methodContract";
import { farplas7StepTr } from "../templates/farplas-7step-tr";
import { HtmlA3Renderer } from "./HtmlA3Renderer";
import type { ProjectModel, StepState } from "../../domain/model";

const rendererMap: A3EntryRendererMap = {
  "generic-text": (payload, entry) => {
    const text = (payload as { text: string }).text;
    return { lines: [{ text: entry.title, bold: true }, { text }] };
  },
};

function emptyStep(): StepState {
  return { entries: [] };
}

function fixtureProject(): ProjectModel {
  return {
    id: "fixture",
    schemaVersion: 1,
    meta: {
      title: "Kapı Panel Gürültü Problemi",
      projectCode: "KZ-2026-014",
      revision: "A",
      owner: { name: "Ayşe Yılmaz" },
      team: [],
      status: "active",
      openedAt: "2026-01-01T00:00:00.000Z",
      language: "tr",
      ai: { enabled: false, redaction: {} },
    },
    templateId: "farplas-7step-tr",
    steps: {
      1: { entries: [] },
      2: emptyStep(),
      3: emptyStep(),
      4: emptyStep(),
      5: emptyStep(),
      6: emptyStep(),
      7: emptyStep(),
      8: emptyStep(),
    },
    signOff: {},
    rounds: [],
  };
}

describe("HtmlA3Renderer", () => {
  it("renders the title and every block header from the descriptor", () => {
    const descriptor = buildA3Layout(fixtureProject(), farplas7StepTr, { rendererMap });
    render(<HtmlA3Renderer descriptor={descriptor} mode="screen" />);

    expect(screen.getByText("Kapı Panel Gürültü Problemi")).toBeDefined();
    expect(screen.getByText("3. HEDEF BELİRLEME")).toBeDefined();
    expect(screen.getByText("7. STANDARDİZASYON")).toBeDefined();
  });

  it("renders visibly smaller in print mode than in screen mode (D-34: ~41.5% fit scale)", () => {
    const descriptor = buildA3Layout(fixtureProject(), farplas7StepTr, { rendererMap });

    const { container: screenContainer } = render(
      <HtmlA3Renderer descriptor={descriptor} mode="screen" />,
    );
    const screenRoot = screenContainer.firstElementChild as HTMLElement;
    const screenColumnCount = screenRoot.style.gridTemplateColumns.split(" ").length;

    const { container: printContainer } = render(
      <HtmlA3Renderer descriptor={descriptor} mode="print" />,
    );
    const printRoot = printContainer.firstElementChild as HTMLElement;

    expect(printRoot.style.gridTemplateColumns.split(" ").length).toBe(screenColumnCount);

    const firstScreenWidth = Number.parseFloat(screenRoot.style.gridTemplateColumns);
    const firstPrintWidth = Number.parseFloat(printRoot.style.gridTemplateColumns);
    expect(firstPrintWidth).toBeLessThan(firstScreenWidth);
  });
});
