import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../../i18n";
import { buildA3Layout } from "../../../a3/buildA3Layout";
import type { A3EntryRendererMap } from "../../../a3/methodContract";
import { farplas7StepTr } from "../../../a3/templates/farplas-7step-tr";
import { blockRectForStep } from "../../../a3/render/blockRectForStep";
import type { ProjectModel, StepState } from "../../../domain/model";
import { A3PreviewReservedBand } from "./A3PreviewReservedBand";
import { fitBlockToBandScale } from "../a3PreviewWindow/zoomMath";
import type { DescriptorResult } from "./useA3PreviewSync";

const openOrFocusA3PreviewWindow = vi.fn();
vi.mock("../a3PreviewWindow/window", () => ({
  openOrFocusA3PreviewWindow: (...args: unknown[]) => openOrFocusA3PreviewWindow(...args),
}));

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
      1: emptyStep(),
      2: emptyStep(),
      3: emptyStep(),
      4: {
        entries: [
          {
            id: "s4-e1",
            methodId: "generic-text",
            title: "Balık kılçığı bulgusu",
            order: 0,
            a3Visibility: "primary",
            payload: { text: "Kalıp aşınması tespit edildi." },
            images: [],
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
            provenance: { origin: "human" },
          },
        ],
      },
      5: emptyStep(),
      6: emptyStep(),
      7: emptyStep(),
      8: emptyStep(),
    },
    signOff: {},
    rounds: [],
  };
}

function buildFixtureDescriptor() {
  return buildA3Layout(fixtureProject(), farplas7StepTr, { rendererMap }).descriptor;
}

const LOADING: DescriptorResult = { status: "loading" };

describe("A3PreviewReservedBand", () => {
  it("shows a waiting message before the very first successful build", () => {
    render(<A3PreviewReservedBand stepId={4} descriptorResult={LOADING} />);

    expect(screen.getByText("Building this step's preview…")).toBeTruthy();
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("renders the active step's own block content once the descriptor is ready", () => {
    const descriptor = buildFixtureDescriptor();
    render(<A3PreviewReservedBand stepId={4} descriptorResult={{ status: "ok", descriptor }} />);

    expect(screen.getByRole("img")).toBeTruthy();
    expect(screen.getByText("Balık kılçığı bulgusu")).toBeTruthy();
    expect(screen.getByText("Live")).toBeTruthy();
  });

  it("crops to the requested step's own block rectangle (same geometry blockRectForStep reports)", () => {
    const descriptor = buildFixtureDescriptor();
    const rect = blockRectForStep(descriptor, 4)!;
    render(<A3PreviewReservedBand stepId={4} descriptorResult={{ status: "ok", descriptor }} />);

    const wrapper = screen.getByRole("img").parentElement as HTMLElement;
    expect(wrapper.style.transform).toContain(`translate(${-rect.leftPx}px, ${-rect.topPx}px)`);
  });

  it("keeps showing the last successfully built descriptor while a newer one is (debounced-)loading — no flicker", () => {
    const descriptor = buildFixtureDescriptor();
    const { rerender } = render(<A3PreviewReservedBand stepId={4} descriptorResult={{ status: "ok", descriptor }} />);
    expect(screen.getByText("Balık kılçığı bulgusu")).toBeTruthy();

    rerender(<A3PreviewReservedBand stepId={4} descriptorResult={LOADING} />);

    // Still on screen — a loading status alone must never blank a preview
    // that already has real content, only dim it.
    expect(screen.getByText("Balık kılçığı bulgusu")).toBeTruthy();
    expect(screen.queryByText("Building this step's preview…")).toBeNull();
  });

  it("still offers the full A3 preview pop-out as an escape hatch", async () => {
    const user = userEvent.setup();
    render(<A3PreviewReservedBand stepId={4} descriptorResult={LOADING} />);

    await user.click(screen.getByRole("button", { name: "A3 Preview" }));

    expect(openOrFocusA3PreviewWindow).toHaveBeenCalledOnce();
  });
});

describe("fitBlockToBandScale (D-283) — the step band may magnify, unlike the pop-out window", () => {
  it("magnifies a block narrower than the band, instead of leaving it at 1:1 with neighbours showing", () => {
    // A real Rev00 ADIM 1 block (495pt = 660px, short enough that width binds) in a ~970px band.
    expect(fitBlockToBandScale(660, 280, 970, 420)).toBeCloseTo(970 / 660, 5);
  });

  it("still shrinks a block taller than the band's own height cap", () => {
    expect(fitBlockToBandScale(660, 1200, 970, 420)).toBeCloseTo(420 / 1200, 5);
  });

  it("never magnifies without bound, however small the block", () => {
    expect(fitBlockToBandScale(10, 10, 4000, 4000)).toBe(2.5);
  });

  it("falls back to 1 before the container has been measured", () => {
    expect(fitBlockToBandScale(660, 280, 0, 420)).toBe(1);
  });
});
