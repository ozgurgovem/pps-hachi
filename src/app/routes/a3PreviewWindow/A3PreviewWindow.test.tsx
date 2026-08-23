import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../../i18n";
import type { A3LayoutDescriptor } from "../../../a3/descriptor";

let capturedOnDescriptor: ((descriptor: A3LayoutDescriptor) => void) | undefined;
const unlistenSpy = vi.fn();
const listenForDescriptorPush = vi.fn((onDescriptor: (descriptor: A3LayoutDescriptor) => void) => {
  capturedOnDescriptor = onDescriptor;
  return Promise.resolve(unlistenSpy);
});

vi.mock("./window", () => ({
  listenForDescriptorPush: (...args: [(descriptor: A3LayoutDescriptor) => void]) =>
    listenForDescriptorPush(...args),
}));

vi.mock("../../../a3/render/HtmlA3Renderer", () => ({
  HtmlA3Renderer: ({ descriptor, mode }: { descriptor: A3LayoutDescriptor; mode: string }) => (
    <div data-testid="stub-renderer">
      {descriptor.templateId} / {mode}
    </div>
  ),
}));

const { A3PreviewWindow } = await import("./A3PreviewWindow");

function fakeDescriptor(templateId: string): A3LayoutDescriptor {
  return {
    templateId,
    language: "en",
    styles: [],
    sheets: {
      a3: {
        name: "a3",
        columns: [{ key: "A", charWidth: 10 }],
        rows: [{ index: 0, heightPt: 20 }],
        merges: [],
        cells: [],
        images: [],
        pageSetup: {
          paperSize: "A3",
          orientation: "landscape",
          fitToPage: true,
          fitToWidth: 1,
          fitToHeight: 1,
          marginsIn: { top: 0, bottom: 0, left: 0, right: 0 },
          printArea: "A1:A1",
          zoomPercent: 70,
        },
        freezePanes: false,
        gridlinesVisible: false,
      },
      appendices: [],
    },
    overflowWarnings: [],
    provisionalBlocks: [],
  };
}

/** Pushes outside of a simulated DOM event, so React needs an explicit `act` to flush the resulting render. */
function pushDescriptor(templateId = "t") {
  act(() => {
    capturedOnDescriptor?.(fakeDescriptor(templateId));
  });
}

beforeEach(() => {
  capturedOnDescriptor = undefined;
  listenForDescriptorPush.mockClear();
  unlistenSpy.mockClear();
});

describe("A3PreviewWindow", () => {
  it("shows a waiting state before any descriptor has arrived", () => {
    render(<A3PreviewWindow />);

    expect(screen.getByText("Waiting for the main window…")).toBeTruthy();
    expect(listenForDescriptorPush).toHaveBeenCalledOnce();
  });

  it("renders the received descriptor once the main window pushes one", () => {
    render(<A3PreviewWindow />);

    pushDescriptor("farplas-7step-tr");

    expect(screen.getByTestId("stub-renderer").textContent).toContain("farplas-7step-tr");
  });

  it("starts in screen mode and switches to print mode on toggle", async () => {
    const user = userEvent.setup();
    render(<A3PreviewWindow />);
    pushDescriptor();

    expect(screen.getByTestId("stub-renderer").textContent).toContain("screen");

    await user.click(screen.getByRole("button", { name: "Print" }));

    expect(screen.getByTestId("stub-renderer").textContent).toContain("print");
  });

  it("zoom in and zoom out buttons move the displayed percentage in the expected direction", async () => {
    const user = userEvent.setup();
    render(<A3PreviewWindow />);
    pushDescriptor();

    const before = screen.getByText(/%$/).textContent;
    await user.click(screen.getByRole("button", { name: "+" }));
    const afterZoomIn = screen.getByText(/%$/).textContent;
    await user.click(screen.getByRole("button", { name: "−" }));
    await user.click(screen.getByRole("button", { name: "−" }));
    const afterZoomOut = screen.getByText(/%$/).textContent;

    expect(Number(afterZoomIn?.replace("%", ""))).toBeGreaterThan(Number(before?.replace("%", "")));
    expect(Number(afterZoomOut?.replace("%", ""))).toBeLessThan(Number(afterZoomIn?.replace("%", "")));
  });

  it("disables Fit to window until a descriptor has arrived", () => {
    render(<A3PreviewWindow />);

    expect(screen.getByRole("button", { name: "Fit to window" })).toHaveProperty("disabled", true);
  });

  it("enables Fit to window once a descriptor has arrived and does not crash on click", async () => {
    const user = userEvent.setup();
    render(<A3PreviewWindow />);
    pushDescriptor();

    const fitButton = screen.getByRole("button", { name: "Fit to window" });
    expect(fitButton).toHaveProperty("disabled", false);
    await user.click(fitButton);
  });

  it("unlistens on unmount", async () => {
    const { unmount } = render(<A3PreviewWindow />);

    unmount();
    // The cleanup resolves a promise before calling the unlisten function —
    // flush that microtask before asserting.
    await Promise.resolve();

    expect(unlistenSpy).toHaveBeenCalledOnce();
  });
});
