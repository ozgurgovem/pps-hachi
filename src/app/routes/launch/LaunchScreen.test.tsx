import { afterEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { invoke } from "@tauri-apps/api/core";
import { getVersion } from "@tauri-apps/api/app";
import { open, save } from "@tauri-apps/plugin-dialog";
import "../../../i18n";
import { LaunchScreen } from "./LaunchScreen";
import { WorkspaceScreen } from "../workspace/WorkspaceScreen";
import { createNewProject } from "../../../domain/model";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));
vi.mock("@tauri-apps/api/app", () => ({ getVersion: vi.fn() }));
vi.mock("@tauri-apps/plugin-dialog", () => ({ open: vi.fn(), save: vi.fn() }));

const mockInvoke = vi.mocked(invoke);
const mockGetVersion = vi.mocked(getVersion);
const mockOpenDialog = vi.mocked(open);
const mockSaveDialog = vi.mocked(save);

function renderLaunchScreen() {
  // Declarative MemoryRouter, not createMemoryRouter/RouterProvider: the
  // data-router's internal fetch-based navigation needs a Request/AbortSignal
  // pairing jsdom's undici polyfill doesn't satisfy. Neither of this app's
  // routes uses a loader/action, so declarative mode is behaviorally identical
  // here and the real app (createHashRouter, a real webview) is unaffected.
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<LaunchScreen />} />
        <Route path="/project" element={<WorkspaceScreen />} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("LaunchScreen", () => {
  test("renders the identity and both primary actions", async () => {
    mockInvoke.mockResolvedValueOnce([]); // recent_list

    renderLaunchScreen();

    expect(screen.getByRole("heading", { name: /PPS Hachi/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: "New PPS Project" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Open Existing Project" })).toBeTruthy();
    await waitFor(() => expect(screen.getByText(/No projects yet/)).toBeTruthy());
  });

  test("renders a recent project card once the list loads", async () => {
    mockInvoke.mockResolvedValueOnce([
      { path: "/tmp/existing.ppsx", title: "Existing Project", currentStep: 1, lastModified: "2026-08-02T00:00:00.000Z" },
    ]);

    renderLaunchScreen();

    expect(await screen.findByText("Existing Project")).toBeTruthy();
  });

  test("New PPS Project: does nothing when the save dialog is cancelled", async () => {
    mockInvoke.mockResolvedValueOnce([]); // recent_list
    mockSaveDialog.mockResolvedValueOnce(null);
    const user = userEvent.setup();

    renderLaunchScreen();
    await waitFor(() => expect(screen.getByText(/No projects yet/)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "New PPS Project" }));

    expect(mockGetVersion).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: /PPS Hachi/ })).toBeTruthy();
  });

  test("New PPS Project: opens a language dialog before creating, and does nothing until a language is chosen", async () => {
    mockInvoke.mockResolvedValueOnce([]); // recent_list on mount
    mockSaveDialog.mockResolvedValueOnce("/tmp/Şişli Arıza.ppsx");
    const user = userEvent.setup();

    renderLaunchScreen();
    await waitFor(() => expect(screen.getByText(/No projects yet/)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "New PPS Project" }));

    expect(await screen.findByRole("heading", { name: "Project language" })).toBeTruthy();
    expect(mockGetVersion).not.toHaveBeenCalled();
  });

  test("New PPS Project: choosing English creates the project with that language and navigates to the confirmation screen", async () => {
    mockInvoke.mockResolvedValueOnce([]); // recent_list on mount
    mockSaveDialog.mockResolvedValueOnce("/tmp/Şişli Arıza.ppsx");
    mockGetVersion.mockResolvedValueOnce("0.1.0");
    mockInvoke.mockResolvedValueOnce({ modifiedMs: 1000 }); // ppsx_write
    mockInvoke.mockResolvedValueOnce([]); // recent_upsert
    mockInvoke.mockResolvedValueOnce([]); // recent_list refresh after the action
    const user = userEvent.setup();

    renderLaunchScreen();
    await waitFor(() => expect(screen.getByText(/No projects yet/)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "New PPS Project" }));
    await user.click(await screen.findByRole("button", { name: "English" }));

    expect(await screen.findByRole("heading", { name: "Şişli Arıza" })).toBeTruthy();
    expect(mockInvoke).toHaveBeenCalledWith(
      "ppsx_write",
      expect.objectContaining({ path: "/tmp/Şişli Arıza.ppsx" }),
    );
  });

  test("New PPS Project: choosing Turkish creates the project with meta.language tr", async () => {
    mockInvoke.mockResolvedValueOnce([]); // recent_list on mount
    mockSaveDialog.mockResolvedValueOnce("/tmp/proje.ppsx");
    mockGetVersion.mockResolvedValueOnce("0.1.0");
    let writtenPayload: unknown;
    mockInvoke.mockImplementationOnce((_cmd, payload) => {
      writtenPayload = payload;
      return Promise.resolve({ modifiedMs: 1000 });
    }); // ppsx_write
    mockInvoke.mockResolvedValueOnce([]); // recent_upsert
    mockInvoke.mockResolvedValueOnce([]); // recent_list refresh after the action
    const user = userEvent.setup();

    renderLaunchScreen();
    await waitFor(() => expect(screen.getByText(/No projects yet/)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "New PPS Project" }));
    await user.click(await screen.findByRole("button", { name: "Turkish" }));

    await screen.findByRole("heading", { name: "proje" });
    const payload = writtenPayload as { project: { meta: { language: string } } };
    expect(payload.project.meta.language).toBe("tr");
  });

  test("Open Existing Project: reads the picked file and navigates to the confirmation screen", async () => {
    const { manifest, project } = createNewProject({ title: "Opened Project", language: "en", appVersion: "0.1.0" });
    mockInvoke.mockResolvedValueOnce([]); // recent_list on mount
    mockOpenDialog.mockResolvedValueOnce("/tmp/opened.ppsx");
    mockInvoke.mockResolvedValueOnce({ manifest, project, otherEntries: [], modifiedMs: 1000 }); // ppsx_read
    mockInvoke.mockResolvedValueOnce([]); // recent_upsert
    mockInvoke.mockResolvedValueOnce([]); // recent_list refresh
    const user = userEvent.setup();

    renderLaunchScreen();
    await waitFor(() => expect(screen.getByText(/No projects yet/)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Open Existing Project" }));

    expect(await screen.findByRole("heading", { name: "Opened Project" })).toBeTruthy();
  });

  test("Open Existing Project: shows an error and stays on the launch screen when the file is corrupt", async () => {
    mockInvoke.mockResolvedValueOnce([]); // recent_list on mount
    mockOpenDialog.mockResolvedValueOnce("/tmp/corrupt.ppsx");
    mockInvoke.mockRejectedValueOnce(new Error("corrupt .ppsx: missing manifest.json")); // ppsx_read
    mockInvoke.mockResolvedValueOnce([]); // recent_list refresh
    const user = userEvent.setup();

    renderLaunchScreen();
    await waitFor(() => expect(screen.getByText(/No projects yet/)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Open Existing Project" }));

    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByRole("heading", { name: /PPS Hachi/ })).toBeTruthy();
  });

  test("M4 polish audit: never lets a rejected save() dialog call escape as an unhandled rejection, and shows a visible error instead", async () => {
    mockInvoke.mockResolvedValueOnce([]); // recent_list on mount
    mockSaveDialog.mockRejectedValueOnce(new Error("dialog subsystem unavailable"));
    const user = userEvent.setup();

    renderLaunchScreen();
    await waitFor(() => expect(screen.getByText(/No projects yet/)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "New PPS Project" }));

    expect((await screen.findByRole("alert")).textContent).toContain("dialog subsystem unavailable");
    expect(screen.getByRole("heading", { name: /PPS Hachi/ })).toBeTruthy();
    expect(mockGetVersion).not.toHaveBeenCalled();
  });

  test("M4 polish audit: never lets a rejected open() dialog call escape as an unhandled rejection, and shows a visible error instead", async () => {
    mockInvoke.mockResolvedValueOnce([]); // recent_list on mount
    mockOpenDialog.mockRejectedValueOnce(new Error("dialog subsystem unavailable"));
    const user = userEvent.setup();

    renderLaunchScreen();
    await waitFor(() => expect(screen.getByText(/No projects yet/)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Open Existing Project" }));

    expect((await screen.findByRole("alert")).textContent).toContain("dialog subsystem unavailable");
    expect(screen.getByRole("heading", { name: /PPS Hachi/ })).toBeTruthy();
    expect(mockInvoke).not.toHaveBeenCalledWith("ppsx_read", expect.anything());
  });
});
