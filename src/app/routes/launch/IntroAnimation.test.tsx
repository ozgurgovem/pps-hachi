import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../../i18n";
import { IntroAnimation } from "./IntroAnimation";

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("IntroAnimation", () => {
  test("focuses the skip button on mount, so a keyboard/screen-reader user is never stranded", () => {
    render(<IntroAnimation onFinish={() => {}} />);

    expect(document.activeElement).toBe(screen.getByRole("button", { name: /skip/i }));
  });

  test("clicking the skip button calls onFinish", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onFinish = vi.fn();
    render(<IntroAnimation onFinish={onFinish} />);

    await user.click(screen.getByRole("button", { name: /skip/i }));

    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  test("clicking anywhere on the overlay also calls onFinish (click-to-skip)", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onFinish = vi.fn();
    const { container } = render(<IntroAnimation onFinish={onFinish} />);

    await user.click(container.firstElementChild as Element);

    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  test("pressing Escape calls onFinish", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onFinish = vi.fn();
    render(<IntroAnimation onFinish={onFinish} />);

    await user.keyboard("{Escape}");

    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  test("calls onFinish on its own once the full sequence's timer elapses", () => {
    const onFinish = vi.fn();
    render(<IntroAnimation onFinish={onFinish} />);

    expect(onFinish).not.toHaveBeenCalled();
    vi.advanceTimersByTime(20100);

    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  test("never fires onFinish after unmount (timer and listener are both cleaned up)", () => {
    const onFinish = vi.fn();
    const { unmount } = render(<IntroAnimation onFinish={onFinish} />);

    unmount();
    vi.advanceTimersByTime(20100);

    expect(onFinish).not.toHaveBeenCalled();
  });

  test("renders every floating phrase's translated text", () => {
    render(<IntroAnimation onFinish={() => {}} />);

    expect(screen.getByText("PROBLEM DEFINITION")).toBeTruthy();
    expect(screen.getByText("ROOT CAUSE")).toBeTruthy();
    expect(screen.getByText("AI COLLABORATION")).toBeTruthy();
  });

  test("renders the real method-illustration panel captions", () => {
    render(<IntroAnimation onFinish={() => {}} />);

    expect(screen.getByText("PARETO ANALYSIS")).toBeTruthy();
    expect(screen.getByText("FISHBONE DIAGRAM")).toBeTruthy();
    expect(screen.getByAltText("STANDARDS")).toBeTruthy();
  });

  test("reveals the PPS Hachi wordmark and slogan", () => {
    render(<IntroAnimation onFinish={() => {}} />);

    expect(screen.getByText("PPS Hachi")).toBeTruthy();
    expect(screen.getByText("BETTER. SOLUTION. TOGETHER.")).toBeTruthy();
  });

  test("a grid phrase's fade animation and its wrapper's drift animation always live on two separate elements (regression: a single element combining both once had its fade duration silently stretched to the drift's own far longer duration — see git history D-… — this layout makes that structurally impossible, since no element here ever carries more than one animation)", () => {
    render(<IntroAnimation onFinish={() => {}} />);

    const word = screen.getByText("ROOT CAUSE");
    const fadeWrapper = word.parentElement;
    const driftWrapper = fadeWrapper?.parentElement;

    expect(fadeWrapper?.style.animation).toContain("intro-fade-window");
    expect(fadeWrapper?.style.animation).not.toContain("intro-drift");
    expect(driftWrapper?.style.animation).toContain("intro-drift-d");
    expect(driftWrapper?.style.animation).not.toContain("intro-fade-window");
  });
});
