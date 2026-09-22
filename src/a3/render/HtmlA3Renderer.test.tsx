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
    const { descriptor } = buildA3Layout(fixtureProject(), farplas7StepTr, { rendererMap });
    render(<HtmlA3Renderer descriptor={descriptor} mode="screen" />);

    expect(screen.getByText("Kapı Panel Gürültü Problemi")).toBeDefined();
    expect(screen.getByText("3. HEDEF BELİRLEME")).toBeDefined();
    expect(screen.getByText("7. STANDARDİZASYON")).toBeDefined();
  });

  it("renders visibly smaller in print mode than in screen mode (D-34: ~41.5% fit scale)", () => {
    const { descriptor } = buildA3Layout(fixtureProject(), farplas7StepTr, { rendererMap });

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

  /**
   * D-135: 11 of the template's 15 cell styles (`entryContent`, `bodyCell`,
   * `title`, `fieldLabel`, …) declare no explicit `font.color`. Found
   * walking the real pop-out preview window in dark theme: that text
   * inherited the app's theme-aware `--color-ink` (near-white in dark mode)
   * onto the sheet's hardcoded white background — unreadable. The sheet is
   * white paper / black ink always, never the app's theme.
   */
  it("defaults to black text so a style with no explicit font color stays readable on the white sheet", () => {
    const { descriptor } = buildA3Layout(fixtureProject(), farplas7StepTr, { rendererMap });
    const { container } = render(<HtmlA3Renderer descriptor={descriptor} mode="screen" />);

    const root = container.firstElementChild as HTMLElement;
    expect(root.style.color).toBe("rgb(0, 0, 0)");

    // `title`'s style declares no font.color of its own — it must inherit
    // black from the root rather than resolving to nothing (which is what
    // let `--color-ink` leak in before this fix).
    const titleCell = screen.getByText("Kapı Panel Gürültü Problemi");
    expect(titleCell.style.color).toBe("");
    expect(getComputedStyle(titleCell).color).toBe("rgb(0, 0, 0)");
  });

  /** The fix must not touch cells that already decided their own color (D-96's PDCA headers). */
  it("leaves a header's own explicit font color untouched", () => {
    const { descriptor } = buildA3Layout(fixtureProject(), farplas7StepTr, { rendererMap });
    render(<HtmlA3Renderer descriptor={descriptor} mode="screen" />);

    const header = screen.getByText("1. PROBLEMİN TANIMLANMASI");
    expect(header.style.color).toBe("rgb(255, 255, 255)");
  });

  /**
   * G3/D-198: a `generic-text` Step 1 entry never satisfies S1's
   * `gap-statement`-specific check (D-196), so its block is expected to
   * carry the approved "Aday A" marker — a dashed graphite border, no fill,
   * no label.
   */
  it("renders a dashed graphite border overlay for a provisional block", () => {
    const project = fixtureProject();
    const { descriptor } = buildA3Layout(
      { ...project, steps: { ...project.steps, 1: { entries: [] } } },
      farplas7StepTr,
      { rendererMap },
    );
    // Sanity: this fixture's Step 1 is empty, so nothing is flagged yet.
    expect(descriptor.provisionalBlocks).toEqual([]);

    const flaggedProject: ProjectModel = {
      ...project,
      steps: {
        ...project.steps,
        1: {
          entries: [
            {
              id: "entry-1",
              methodId: "generic-text",
              title: "Ön Kapı Paneli Gürültü Problemi",
              order: 0,
              a3Visibility: "primary",
              payload: { text: "Kapı panelinden zaman zaman ses geliyor." },
              images: [],
              createdAt: "2026-01-01T00:00:00.000Z",
              updatedAt: "2026-01-01T00:00:00.000Z",
              provenance: { origin: "human" },
            },
          ],
        },
      },
    };
    const { descriptor: flaggedDescriptor } = buildA3Layout(flaggedProject, farplas7StepTr, {
      rendererMap,
    });
    expect(flaggedDescriptor.provisionalBlocks).toEqual([{ stepIds: [1], range: "B7:O21" }]);

    const { container } = render(<HtmlA3Renderer descriptor={flaggedDescriptor} mode="screen" />);

    const markers = container.querySelectorAll('[aria-hidden="true"]');
    expect(markers).toHaveLength(1);
    const marker = markers[0] as HTMLElement;
    expect(marker.style.borderStyle).toBe("dashed");
    expect(marker.style.borderColor).toBe("rgb(32, 36, 31)"); // #20241F
    expect(marker.style.backgroundColor).toBe("");
  });
});

/**
 * KÖK NEDEN (2026-09-22, D-283) — Barış'ın "grafikler hâlâ çok küçük,
 * okunabilir değil" raporunun gerçek sebebi, ve neden D-279/D-280/D-281'in
 * üçü de kaçırdı.
 *
 * Tailwind's Preflight ships `img, video { max-width: 100%; height: auto; }`
 * (verified in the compiled bundle, not assumed). Every A3 image is a grid
 * item anchored to ONE grid cell, so `max-width: 100%` resolves against a
 * single column — 41.25pt / 55px on the Rev00 form — and silently caps the
 * image there no matter what inline width is set. A chart asking for 330px
 * rendered at 55px: exactly the 6x shrink seen on screen.
 *
 * That is why three consecutive rounds of "make the chart bigger" changed
 * nothing: every one of them adjusted geometry INSIDE the SVG component,
 * while the cap was applied from a global stylesheet OUTSIDE it. The
 * component was always handed the right box and always drew into it; the
 * browser then shrank the finished image.
 *
 * jsdom does not apply Tailwind's stylesheet, so this cannot be caught by
 * asserting a computed width. What it CAN assert — and what actually
 * protects the fix — is that the renderer explicitly neutralises the cap.
 * Removing either line below is what would reintroduce the bug.
 */
describe("HtmlA3Renderer — images must not be capped by the global img rule (D-283)", () => {
  function descriptorWithImage() {
    const { descriptor } = buildA3Layout(fixtureProject(), farplas7StepTr, {
      rendererMap,
      images: [
        {
          id: "probe-image",
          data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
          mimeType: "image/png",
          anchorCell: "B8",
          widthPt: 247.5,
          heightPt: 299,
        },
      ],
    });
    return descriptor;
  }

  it("renders the image at its full descriptor size, with both global caps explicitly turned off", () => {
    const { container } = render(<HtmlA3Renderer descriptor={descriptorWithImage()} mode="screen" />);
    const img = container.querySelector("img");
    expect(img).not.toBeNull();

    // The cap Preflight would otherwise impose, neutralised.
    expect(img!.style.maxWidth).toBe("none");
    expect(img!.style.maxHeight).toBe("none");

    // And the size actually asked for: 247.5pt x 299pt at 96/72 px per pt.
    expect(img!.style.width).toBe(`${247.5 * (96 / 72)}px`);
    expect(img!.style.height).toBe(`${299 * (96 / 72)}px`);
  });
});
