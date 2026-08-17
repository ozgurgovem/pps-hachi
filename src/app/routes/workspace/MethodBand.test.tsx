import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { z } from "zod";
import "../../../i18n";
import type { ErasedMethodPlugin } from "../../../methods";
import { MethodBand } from "./MethodBand";

const { mockGetMethodsForStep } = vi.hoisted(() => ({ mockGetMethodsForStep: vi.fn() }));

vi.mock("../../../methods", async () => {
  const actual = await vi.importActual<typeof import("../../../methods")>("../../../methods");
  return { ...actual, getMethodsForStep: mockGetMethodsForStep };
});

/**
 * A minimal, schema-valid stand-in plugin — these tests only exercise
 * `MethodBand`'s own grouping/disclosure logic (D-169), never
 * `EntryEditorDialog` (never opened here), so the payload/Editor/renderToA3
 * fields just need to satisfy `ErasedMethodPlugin`'s shape.
 */
function plugin(id: string, nameKey: string, tier?: "recommended" | "more"): ErasedMethodPlugin {
  return {
    id,
    steps: [1],
    nameKey,
    // Real per-method locale files always ship both siblings — reusing
    // `nameKey` for both fields would render the same text twice (once as
    // the card name, once as the "use when" copy) and break text queries.
    useWhenKey: nameKey.replace(".name", ".useWhen"),
    schema: z.looseObject({}),
    Editor: () => null,
    createEmptyPayload: () => ({}),
    renderToA3: () => ({ lines: [] }),
    // `exactOptionalPropertyTypes`: an omitted `tier` key (unset, D-169's
    // "more" default) is not the same type as an explicit `tier: undefined`.
    ...(tier === undefined ? {} : { tier }),
  };
}

const GAP = plugin("gap-statement", "methods.gapStatement.name", "recommended");
const FIVE_W2H = plugin("five-w2h", "methods.fiveW2H.name", "recommended");
const ACTION = plugin("action-item", "methods.actionItem.name", "more");
const WEIGHTED = plugin("weighted-decision-matrix", "methods.weightedDecisionMatrix.name", undefined);

function renderMethodBand() {
  return render(<MethodBand stepId={1} />);
}

/** DOM-order check via `compareDocumentPosition`, robust against CSS/layout. */
function expectsBefore(a: Element, b: Element) {
  expect(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
}

describe("MethodBand — D-169 two-section layout", () => {
  it("shows recommended cards by default, without expanding anything", () => {
    mockGetMethodsForStep.mockReturnValue([GAP, FIVE_W2H, ACTION]);
    renderMethodBand();

    expect(screen.getByText("Gap statement")).toBeTruthy();
    expect(screen.getByText("5W2H")).toBeTruthy();
  });

  it("keeps the 'more' tier collapsed by default", () => {
    mockGetMethodsForStep.mockReturnValue([GAP, ACTION]);
    renderMethodBand();

    expect(screen.queryByText("Action")).toBeNull();
    const toggle = screen.getByRole("button", { name: /other formats/i });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });

  it("expands the other-methods list on toggle and flips aria-expanded", async () => {
    const user = userEvent.setup();
    mockGetMethodsForStep.mockReturnValue([GAP, ACTION]);
    renderMethodBand();

    const toggle = screen.getByRole("button", { name: /other formats/i });
    await user.click(toggle);

    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText("Action")).toBeTruthy();
  });

  it("treats an unset tier the same as 'more'", () => {
    mockGetMethodsForStep.mockReturnValue([GAP, WEIGHTED]);
    renderMethodBand();

    expect(screen.queryByText("Weighted decision matrix (Pugh)")).toBeNull();
    expect(screen.getByRole("button", { name: /other formats/i })).toBeTruthy();
  });

  it("renders no disclosure at all when every method is recommended", () => {
    mockGetMethodsForStep.mockReturnValue([GAP, FIVE_W2H]);
    renderMethodBand();

    expect(screen.queryByRole("button", { name: /other formats/i })).toBeNull();
  });

  it("preserves getMethodsForStep's own order within each group", async () => {
    const user = userEvent.setup();
    // Deliberately interleaved — recommended and more tiers mixed in the
    // source order, exactly what a real registry scan (not a pre-sorted
    // list) would hand back.
    mockGetMethodsForStep.mockReturnValue([ACTION, GAP, WEIGHTED, FIVE_W2H]);
    renderMethodBand();

    const gapCard = screen.getByText("Gap statement");
    const fiveW2HCard = screen.getByText("5W2H");
    expectsBefore(gapCard, fiveW2HCard);

    await user.click(screen.getByRole("button", { name: /other formats/i }));
    const actionCard = screen.getByText("Action");
    const weightedCard = screen.getByText("Weighted decision matrix (Pugh)");
    expectsBefore(actionCard, weightedCard);
  });

  it("the other-methods toggle is keyboard reachable as a native button", () => {
    mockGetMethodsForStep.mockReturnValue([GAP, ACTION]);
    renderMethodBand();

    const toggle = screen.getByRole("button", { name: /other formats/i });
    expect(toggle.tagName).toBe("BUTTON");
  });

  it("scopes both groups inside the same 'Add an entry' section", async () => {
    const user = userEvent.setup();
    mockGetMethodsForStep.mockReturnValue([GAP, ACTION]);
    renderMethodBand();

    const section = screen.getByRole("heading", { name: "Add an entry" }).closest("section");
    expect(within(section!).getByText("Gap statement")).toBeTruthy();

    await user.click(within(section!).getByRole("button", { name: /other formats/i }));
    expect(within(section!).getByText("Action")).toBeTruthy();
  });
});
