import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../../i18n";
import { createNewProject } from "../../../domain/model";
import type { ProjectModel, SignOffState } from "../../../domain/model";
import { useProjectStore } from "../../../state";
import { SignOffPanel } from "./SignOffPanel";

const initialStoreState = useProjectStore.getState();

function renderPanel(signOff: SignOffState = {}) {
  const { project } = createNewProject({ title: "T", language: "en", appVersion: "0.1.0" });
  const withSignOff: ProjectModel = { ...project, signOff };
  useProjectStore.setState({ ...initialStoreState, project: withSignOff });
  return withSignOff;
}

describe("SignOffPanel", () => {
  it("shows a name input and Sign button for each of the three unsigned roles", () => {
    renderPanel();
    render(<SignOffPanel />);

    expect(screen.getByLabelText("Prepared by")).toBeTruthy();
    expect(screen.getByLabelText("Reviewed by")).toBeTruthy();
    expect(screen.getByLabelText("Approved by")).toBeTruthy();
  });

  it("signs a role, writing the typed name and a timestamp", async () => {
    const user = userEvent.setup();
    renderPanel();
    render(<SignOffPanel />);

    await user.type(screen.getByLabelText("Prepared by"), "Ada");
    await user.click(screen.getAllByRole("button", { name: "Sign" })[0]!);

    const signOff = useProjectStore.getState().project?.signOff;
    expect(signOff?.preparedBy?.name).toBe("Ada");
    expect(signOff?.preparedBy?.signedAt).toBeTruthy();
  });

  it("shows a signed role's name instead of the input, with a clear control", () => {
    renderPanel({ reviewedBy: { name: "Grace", signedAt: "2026-08-18T00:00:00.000Z" } });
    render(<SignOffPanel />);

    expect(screen.getByText(/Grace/)).toBeTruthy();
    expect(screen.queryByLabelText("Reviewed by")).toBeNull();
    expect(screen.getByRole("button", { name: "Clear" })).toBeTruthy();
  });

  it("clears a signed role back to the name input", async () => {
    const user = userEvent.setup();
    renderPanel({ approvedBy: { name: "Grace", signedAt: "2026-08-18T00:00:00.000Z" } });
    render(<SignOffPanel />);

    await user.click(screen.getByRole("button", { name: "Clear" }));

    expect(useProjectStore.getState().project?.signOff.approvedBy).toBeUndefined();
  });

  it("leaves the other two roles untouched when one is signed", async () => {
    const user = userEvent.setup();
    renderPanel({ reviewedBy: { name: "Grace", signedAt: "2026-08-18T00:00:00.000Z" } });
    render(<SignOffPanel />);

    await user.type(screen.getByLabelText("Prepared by"), "Ada");
    await user.click(screen.getAllByRole("button", { name: "Sign" })[0]!);

    const signOff = useProjectStore.getState().project?.signOff;
    expect(signOff?.reviewedBy?.name).toBe("Grace");
    expect(signOff?.preparedBy?.name).toBe("Ada");
  });
});
