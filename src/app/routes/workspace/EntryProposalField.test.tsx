import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { open } from "@tauri-apps/plugin-dialog";
import "../../../i18n";
import { getMethodById } from "../../../methods";
import type { ResolvedRedactionPolicy } from "../../../ai/redaction";
import { ingestTablePreview } from "../../../ai/ingestIpc";
import { EntryProposalField } from "./EntryProposalField";
import * as entryProposal from "./entryProposal";

// `getMethodById` (not the raw `paretoMethod` export) so `plugin` is the
// same `ErasedMethodPlugin` shape `EntryEditorDialog` actually passes —
// `MethodPlugin<ParetoPayload>` isn't assignable to it under
// `exactOptionalPropertyTypes` (D-135's own registry-erasure precedent).
const paretoPlugin = (() => {
  const plugin = getMethodById("pareto");
  if (!plugin) {
    throw new Error("pareto method must be registered for this test file to run");
  }
  return plugin;
})();

vi.mock("./entryProposal", async () => {
  const actual = await vi.importActual<typeof import("./entryProposal")>("./entryProposal");
  return { ...actual, proposeStructuredEntry: vi.fn() };
});

vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn(),
}));

vi.mock("../../../ai/ingestIpc", () => ({
  ingestTablePreview: vi.fn(),
}));

const mockedPropose = vi.mocked(entryProposal.proposeStructuredEntry);
const mockedOpen = vi.mocked(open);
const mockedIngestTablePreview = vi.mocked(ingestTablePreview);

const OFF: ResolvedRedactionPolicy = { mode: "off", terms: [], preserveNumbers: true };

afterEach(() => {
  vi.clearAllMocks();
});

function renderField(onAccept = vi.fn(), redaction: ResolvedRedactionPolicy = OFF) {
  render(
    <EntryProposalField
      stepId={2}
      plugin={paretoPlugin}
      promptVersion="v1"
      modelId="vorion/gpt-4o"
      acceptedBy="Ada"
      projectId="proj-1"
      redaction={redaction}
      onAccept={onAccept}
    />,
  );
  return { onAccept };
}

describe("EntryProposalField", () => {
  it("shows only the trigger button until clicked", () => {
    renderField();

    expect(screen.getByRole("button", { name: "Propose with AI" })).toBeTruthy();
    expect(screen.queryByRole("textbox", { name: "Raw data" })).toBeNull();
  });

  it("opens the raw-data input on trigger click, disables Propose until text is entered", async () => {
    const user = userEvent.setup();
    renderField();

    await user.click(screen.getByRole("button", { name: "Propose with AI" }));

    expect(screen.getByRole("textbox", { name: "Raw data" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Propose" })).toHaveProperty("disabled", true);
  });

  it("calls proposeStructuredEntry with the pareto schema, modelId and redaction policy on success", async () => {
    const user = userEvent.setup();
    mockedPropose.mockResolvedValueOnce({
      outcome: "success",
      value: { unit: "count", categories: [{ id: "weld", label: "Weld defect", count: 12 }] },
    });
    const redaction: ResolvedRedactionPolicy = { mode: "customers", terms: ["Acme Corp"], preserveNumbers: true };
    renderField(vi.fn(), redaction);

    await user.click(screen.getByRole("button", { name: "Propose with AI" }));
    await user.type(screen.getByRole("textbox", { name: "Raw data" }), "weld defect: 12");
    await user.click(screen.getByRole("button", { name: "Propose" }));

    expect(mockedPropose).toHaveBeenCalledWith(
      expect.objectContaining({
        userInput: "weld defect: 12",
        modelId: "vorion/gpt-4o",
        zodSchema: paretoPlugin.schema,
        redaction,
      }),
    );
    expect(await screen.findByDisplayValue("Weld defect")).toBeTruthy();
    expect(await screen.findByDisplayValue("12")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Accept" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reject" })).toBeTruthy();
  });

  it("accepts the draft unedited as ai-accepted, calling onAccept with a full Provenance", async () => {
    const user = userEvent.setup();
    mockedPropose.mockResolvedValueOnce({
      outcome: "success",
      value: { unit: "count", categories: [{ id: "weld", label: "Weld defect", count: 12 }] },
    });
    const { onAccept } = renderField();

    await user.click(screen.getByRole("button", { name: "Propose with AI" }));
    await user.type(screen.getByRole("textbox", { name: "Raw data" }), "weld defect: 12");
    await user.click(screen.getByRole("button", { name: "Propose" }));
    await screen.findByRole("button", { name: "Accept" });
    await user.click(screen.getByRole("button", { name: "Accept" }));

    expect(onAccept).toHaveBeenCalledTimes(1);
    const [payload, provenance] = onAccept.mock.calls[0] as [unknown, import("../../../domain/model").Provenance];
    expect(payload).toEqual({ unit: "count", categories: [{ id: "weld", label: "Weld defect", count: 12 }] });
    expect(provenance.origin).toBe("ai-accepted");
    expect(provenance.model).toEqual({ providerId: "vorion", modelId: "vorion/gpt-4o", promptVersion: "pareto.v1" });
    expect(provenance.acceptedBy).toBe("Ada");
    expect(provenance.editDistance).toBe(0);
    // The field collapses back to just the trigger after a successful accept.
    expect(screen.getByRole("button", { name: "Propose with AI" })).toBeTruthy();
  });

  it("marks the entry ai-edited with a nonzero editDistance when the draft is changed before accepting", async () => {
    const user = userEvent.setup();
    mockedPropose.mockResolvedValueOnce({
      outcome: "success",
      value: { unit: "count", categories: [{ id: "weld", label: "Weld defect", count: 12 }] },
    });
    const { onAccept } = renderField();

    await user.click(screen.getByRole("button", { name: "Propose with AI" }));
    await user.type(screen.getByRole("textbox", { name: "Raw data" }), "weld defect: 12");
    await user.click(screen.getByRole("button", { name: "Propose" }));
    const countField = await screen.findByDisplayValue("12");
    await user.clear(countField);
    await user.type(countField, "20");
    await user.click(screen.getByRole("button", { name: "Accept" }));

    expect(onAccept).toHaveBeenCalledTimes(1);
    const [, provenance] = onAccept.mock.calls[0] as [unknown, import("../../../domain/model").Provenance];
    expect(provenance.origin).toBe("ai-edited");
    expect(provenance.editDistance).toBeGreaterThan(0);
  });

  it("rejecting a draft returns to the input, writing nothing", async () => {
    const user = userEvent.setup();
    mockedPropose.mockResolvedValueOnce({
      outcome: "success",
      value: { unit: "count", categories: [] },
    });
    const { onAccept } = renderField();

    await user.click(screen.getByRole("button", { name: "Propose with AI" }));
    await user.type(screen.getByRole("textbox", { name: "Raw data" }), "anything");
    await user.click(screen.getByRole("button", { name: "Propose" }));
    await user.click(await screen.findByRole("button", { name: "Reject" }));

    expect(onAccept).not.toHaveBeenCalled();
    expect(screen.getByRole("textbox", { name: "Raw data" })).toBeTruthy();
  });

  it("shows the raw response and writes nothing when the proposal fails validation twice", async () => {
    const user = userEvent.setup();
    mockedPropose.mockResolvedValueOnce({ outcome: "failed", rawText: "not valid json at all" });
    const { onAccept } = renderField();

    await user.click(screen.getByRole("button", { name: "Propose with AI" }));
    await user.type(screen.getByRole("textbox", { name: "Raw data" }), "anything");
    await user.click(screen.getByRole("button", { name: "Propose" }));

    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByText("not valid json at all")).toBeTruthy();
    expect(onAccept).not.toHaveBeenCalled();
  });

  it("shows an error and allows retry when the IPC call itself rejects", async () => {
    const user = userEvent.setup();
    mockedPropose.mockRejectedValueOnce(new Error("no API key is configured"));
    renderField();

    await user.click(screen.getByRole("button", { name: "Propose with AI" }));
    await user.type(screen.getByRole("textbox", { name: "Raw data" }), "anything");
    await user.click(screen.getByRole("button", { name: "Propose" }));

    expect((await screen.findByRole("alert")).textContent).toBe("no API key is configured");
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(screen.getByRole("textbox", { name: "Raw data" })).toBeTruthy();
  });

  it("cancelling the input closes the field back to just the trigger", async () => {
    const user = userEvent.setup();
    renderField();

    await user.click(screen.getByRole("button", { name: "Propose with AI" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByRole("button", { name: "Propose with AI" })).toBeTruthy();
    expect(screen.queryByRole("textbox", { name: "Raw data" })).toBeNull();
  });

  describe("attachment review sheet", () => {
    function samplePreview() {
      return {
        fileName: "defects.xlsx",
        fileSizeBytes: 20_480,
        table: {
          headers: ["Defect Category", "Count"],
          rowCount: 5,
          sampleRows: [["Scratch", "3"]],
          stratifiedBy: null,
          groupCounts: [],
          truncated: false,
        },
      };
    }

    it("does nothing when the user dismisses the native file dialog", async () => {
      const user = userEvent.setup();
      mockedOpen.mockResolvedValueOnce(null);
      renderField();

      await user.click(screen.getByRole("button", { name: "Propose with AI" }));
      await user.click(screen.getByRole("button", { name: "Add file" }));

      expect(mockedIngestTablePreview).not.toHaveBeenCalled();
      expect(screen.getByRole("button", { name: "Add file" })).toBeTruthy();
    });

    it("shows a review sheet with file name, size and row count after a file is picked", async () => {
      const user = userEvent.setup();
      mockedOpen.mockResolvedValueOnce("/Users/ada/defects.xlsx");
      mockedIngestTablePreview.mockResolvedValueOnce(samplePreview());
      renderField();

      await user.click(screen.getByRole("button", { name: "Propose with AI" }));
      await user.click(screen.getByRole("button", { name: "Add file" }));

      expect(await screen.findByText(/defects\.xlsx/)).toBeTruthy();
      expect(screen.getByText(/20\.0 KB/)).toBeTruthy();
      expect(screen.getByText(/5/)).toBeTruthy();
    });

    it("shows the off-mode redaction note when the project has redaction disabled", async () => {
      const user = userEvent.setup();
      mockedOpen.mockResolvedValueOnce("/Users/ada/defects.xlsx");
      mockedIngestTablePreview.mockResolvedValueOnce(samplePreview());
      renderField(vi.fn(), OFF);

      await user.click(screen.getByRole("button", { name: "Propose with AI" }));
      await user.click(screen.getByRole("button", { name: "Add file" }));

      expect(await screen.findByText("Redaction: off")).toBeTruthy();
    });

    it("shows the active-terms redaction note when the project has customers-mode redaction on", async () => {
      const user = userEvent.setup();
      mockedOpen.mockResolvedValueOnce("/Users/ada/defects.xlsx");
      mockedIngestTablePreview.mockResolvedValueOnce(samplePreview());
      renderField(vi.fn(), { mode: "customers", terms: ["Acme Corp", "Beta Inc"], preserveNumbers: true });

      await user.click(screen.getByRole("button", { name: "Propose with AI" }));
      await user.click(screen.getByRole("button", { name: "Add file" }));

      expect(await screen.findByText(/2 term/)).toBeTruthy();
    });

    it("appends the file summary to the textarea only after Confirm is clicked", async () => {
      const user = userEvent.setup();
      mockedOpen.mockResolvedValueOnce("/Users/ada/defects.xlsx");
      mockedIngestTablePreview.mockResolvedValueOnce(samplePreview());
      renderField();

      await user.click(screen.getByRole("button", { name: "Propose with AI" }));
      await user.click(screen.getByRole("button", { name: "Add file" }));
      await screen.findByText(/defects\.xlsx/);

      const textarea = screen.getByRole("textbox", { name: "Raw data" }) as HTMLTextAreaElement;
      expect(textarea.value).toBe("");

      await user.click(screen.getByRole("button", { name: "Add to prompt" }));

      expect(textarea.value).toContain("Attached file: defects.xlsx");
      expect(textarea.value).toContain("Defect Category=Scratch, Count=3");
      expect(screen.queryByRole("button", { name: "Add to prompt" })).toBeNull();
    });

    it("discarding a reviewed attachment leaves the textarea untouched", async () => {
      const user = userEvent.setup();
      mockedOpen.mockResolvedValueOnce("/Users/ada/defects.xlsx");
      mockedIngestTablePreview.mockResolvedValueOnce(samplePreview());
      renderField();

      await user.click(screen.getByRole("button", { name: "Propose with AI" }));
      await user.click(screen.getByRole("button", { name: "Add file" }));
      await screen.findByText(/defects\.xlsx/);
      await user.click(screen.getByRole("button", { name: "Discard" }));

      const textarea = screen.getByRole("textbox", { name: "Raw data" }) as HTMLTextAreaElement;
      expect(textarea.value).toBe("");
      expect(screen.getByRole("button", { name: "Add file" })).toBeTruthy();
    });

    it("shows an error when reading the file fails, without touching the textarea", async () => {
      const user = userEvent.setup();
      mockedOpen.mockResolvedValueOnce("/Users/ada/corrupt.xlsx");
      mockedIngestTablePreview.mockRejectedValueOnce(new Error("could not read the spreadsheet"));
      renderField();

      await user.click(screen.getByRole("button", { name: "Propose with AI" }));
      await user.click(screen.getByRole("button", { name: "Add file" }));

      expect(await screen.findByRole("alert")).toHaveProperty("textContent", "could not read the spreadsheet");
    });
  });
});
