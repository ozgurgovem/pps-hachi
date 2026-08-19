import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../../i18n";
import { createNewProject } from "../../../domain/model";
import type { ProjectModel, Round } from "../../../domain/model";
import { useProjectStore } from "../../../state";
import { RoundsBand } from "./RoundsBand";

const initialStoreState = useProjectStore.getState();

function renderBand(rounds: readonly Round[] = []) {
  const { project } = createNewProject({ title: "T", language: "en", appVersion: "0.1.0" });
  const withRounds: ProjectModel = { ...project, rounds: [...rounds] };
  useProjectStore.setState({ ...initialStoreState, project: withRounds });
  return withRounds;
}

describe("RoundsBand", () => {
  it("shows the empty state when no rounds exist yet", () => {
    renderBand();
    render(<RoundsBand />);

    expect(screen.getByText("No rounds opened yet.")).toBeTruthy();
  });

  it("lists existing rounds by ordinal, reason and opened date", () => {
    renderBand([{ id: "r1", openedAt: "2026-08-10T00:00:00.000Z", reason: "Target not met" }]);
    render(<RoundsBand />);

    expect(screen.getByText(/Round 1/)).toBeTruthy();
    expect(screen.getByText(/Target not met/)).toBeTruthy();
  });

  it("disables the start button until a reason is entered", () => {
    renderBand();
    render(<RoundsBand />);

    const button = screen.getByRole("button", { name: "Start new analysis round" }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it("dispatches a new round on start, appended after any existing ones", async () => {
    const user = userEvent.setup();
    renderBand([{ id: "r1", openedAt: "2026-08-01T00:00:00.000Z", closedAt: "2026-08-05T00:00:00.000Z", reason: "first" }]);
    render(<RoundsBand />);

    await user.type(screen.getByLabelText("Why is a new round starting?"), "second pass");
    await user.click(screen.getByRole("button", { name: "Start new analysis round" }));

    const project = useProjectStore.getState().project;
    expect(project?.rounds).toHaveLength(2);
    expect(project?.rounds[1]).toMatchObject({ reason: "second pass" });
  });

  it("clears the reason field after starting a round", async () => {
    const user = userEvent.setup();
    renderBand();
    render(<RoundsBand />);

    const input = screen.getByLabelText("Why is a new round starting?") as HTMLInputElement;
    await user.type(input, "second pass");
    await user.click(screen.getByRole("button", { name: "Start new analysis round" }));

    expect(input.value).toBe("");
  });
});
