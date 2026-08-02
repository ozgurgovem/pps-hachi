import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../../i18n";
import { RecentProjectCard } from "./RecentProjectCard";
import type { RecentEntryMeta } from "./recentEntry";

const entry: RecentEntryMeta = {
  path: "/tmp/sisli.ppsx",
  title: "Şişli Hattı Arıza Analizi",
  customer: "Farplas",
  owner: "B. Gövem",
  currentStep: 3,
  lastModified: "2026-08-02T10:30:00.000Z",
};

describe("RecentProjectCard", () => {
  test("renders the title, customer/owner and last-modified date", () => {
    render(<RecentProjectCard entry={entry} onOpen={() => {}} />);

    expect(screen.getByText("Şişli Hattı Arıza Analizi")).toBeTruthy();
    expect(screen.getByText("Farplas · B. Gövem")).toBeTruthy();
  });

  test("calls onOpen with the entry's path when clicked", async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(<RecentProjectCard entry={entry} onOpen={onOpen} />);

    await user.click(screen.getByRole("button"));

    expect(onOpen).toHaveBeenCalledWith("/tmp/sisli.ppsx");
  });

  test("is disabled and does not call onOpen when disabled is true", async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(<RecentProjectCard entry={entry} onOpen={onOpen} disabled />);

    await user.click(screen.getByRole("button"));

    expect(onOpen).not.toHaveBeenCalled();
  });

  test("falls back to an em dash when neither customer nor owner is set", () => {
    const bare: RecentEntryMeta = { path: "/tmp/bare.ppsx", title: "Bare", currentStep: 0, lastModified: entry.lastModified };
    render(<RecentProjectCard entry={bare} onOpen={() => {}} />);

    expect(screen.getByText("—")).toBeTruthy();
  });
});
