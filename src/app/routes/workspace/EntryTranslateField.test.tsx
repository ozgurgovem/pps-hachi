import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../../i18n";
import { getMethodById } from "../../../methods";
import type { ResolvedRedactionPolicy } from "../../../ai/redaction";
import type { Provenance } from "../../../domain/model";
import { EntryTranslateField } from "./EntryTranslateField";
import * as entryTranslation from "./entryTranslation";

const genericTextPlugin = (() => {
  const plugin = getMethodById("generic-text");
  if (!plugin) {
    throw new Error("generic-text method must be registered for this test file to run");
  }
  return plugin;
})();

vi.mock("./entryTranslation", async () => {
  const actual = await vi.importActual<typeof import("./entryTranslation")>("./entryTranslation");
  return { ...actual, proposeEntryTranslation: vi.fn() };
});

const mockedPropose = vi.mocked(entryTranslation.proposeEntryTranslation);

const OFF: ResolvedRedactionPolicy = { mode: "off", terms: [], preserveNumbers: true };

afterEach(() => {
  vi.clearAllMocks();
});

function renderField(onAccept = vi.fn()) {
  render(
    <EntryTranslateField
      plugin={genericTextPlugin}
      title="Original title"
      payload={{ text: "Original body" }}
      sourceLanguage="en"
      modelId="vorion/gpt-4o"
      acceptedBy="Ada"
      projectId="proj-1"
      redaction={OFF}
      onAccept={onAccept}
    />,
  );
  return { onAccept };
}

describe("EntryTranslateField", () => {
  it("shows only the trigger button, naming the target language, until clicked", () => {
    renderField();

    expect(screen.getByRole("button", { name: "Translate to Turkish" })).toBeTruthy();
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("calls proposeEntryTranslation with the entry's own title/payload, source/target language and a wrapped schema", async () => {
    const user = userEvent.setup();
    mockedPropose.mockResolvedValueOnce({
      outcome: "success",
      title: "Çevrilmiş başlık",
      payload: { text: "Çevrilmiş metin" },
    });
    renderField();

    await user.click(screen.getByRole("button", { name: "Translate to Turkish" }));

    expect(mockedPropose).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Original title",
        payload: { text: "Original body" },
        sourceLanguage: "en",
        targetLanguage: "tr",
        modelId: "vorion/gpt-4o",
        redaction: OFF,
      }),
    );
    expect(await screen.findByDisplayValue("Çevrilmiş başlık")).toBeTruthy();
    expect(screen.getByDisplayValue("Çevrilmiş metin")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Accept" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reject" })).toBeTruthy();
  });

  it("accepts the draft unedited as ai-accepted, calling onAccept with a full Provenance", async () => {
    const user = userEvent.setup();
    mockedPropose.mockResolvedValueOnce({
      outcome: "success",
      title: "Çevrilmiş başlık",
      payload: { text: "Çevrilmiş metin" },
    });
    const { onAccept } = renderField();

    await user.click(screen.getByRole("button", { name: "Translate to Turkish" }));
    await screen.findByRole("button", { name: "Accept" });
    await user.click(screen.getByRole("button", { name: "Accept" }));

    expect(onAccept).toHaveBeenCalledTimes(1);
    const [nextTitle, nextPayload, provenance] = onAccept.mock.calls[0] as [string, unknown, Provenance];
    expect(nextTitle).toBe("Çevrilmiş başlık");
    expect(nextPayload).toEqual({ text: "Çevrilmiş metin" });
    expect(provenance.origin).toBe("ai-accepted");
    expect(provenance.model).toEqual({
      providerId: "vorion",
      modelId: "vorion/gpt-4o",
      promptVersion: "translate-entry.v1",
    });
    expect(provenance.acceptedBy).toBe("Ada");
    expect(provenance.editDistance).toBe(0);
    // Collapses back to just the trigger after a successful accept.
    expect(screen.getByRole("button", { name: "Translate to Turkish" })).toBeTruthy();
  });

  it("marks the entry ai-edited with a nonzero editDistance when the draft title is changed before accepting", async () => {
    const user = userEvent.setup();
    mockedPropose.mockResolvedValueOnce({
      outcome: "success",
      title: "Çevrilmiş başlık",
      payload: { text: "Çevrilmiş metin" },
    });
    const { onAccept } = renderField();

    await user.click(screen.getByRole("button", { name: "Translate to Turkish" }));
    const titleInput = await screen.findByDisplayValue("Çevrilmiş başlık");
    await user.type(titleInput, " (edited)");
    await user.click(screen.getByRole("button", { name: "Accept" }));

    expect(onAccept).toHaveBeenCalledTimes(1);
    const [, , provenance] = onAccept.mock.calls[0] as [string, unknown, Provenance];
    expect(provenance.origin).toBe("ai-edited");
    expect(provenance.editDistance).toBeGreaterThan(0);
  });

  it("rejecting a draft returns to the trigger, writing nothing", async () => {
    const user = userEvent.setup();
    mockedPropose.mockResolvedValueOnce({
      outcome: "success",
      title: "Çevrilmiş başlık",
      payload: { text: "Çevrilmiş metin" },
    });
    const { onAccept } = renderField();

    await user.click(screen.getByRole("button", { name: "Translate to Turkish" }));
    await user.click(await screen.findByRole("button", { name: "Reject" }));

    expect(onAccept).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Translate to Turkish" })).toBeTruthy();
  });

  it("shows the raw response and writes nothing when the translation fails validation twice", async () => {
    const user = userEvent.setup();
    mockedPropose.mockResolvedValueOnce({ outcome: "failed", rawText: "not valid json at all" });
    const { onAccept } = renderField();

    await user.click(screen.getByRole("button", { name: "Translate to Turkish" }));

    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByText("not valid json at all")).toBeTruthy();
    expect(onAccept).not.toHaveBeenCalled();
  });

  it("shows an error and allows retry when the IPC call itself rejects", async () => {
    const user = userEvent.setup();
    mockedPropose.mockRejectedValueOnce(new Error("no API key is configured"));
    renderField();

    await user.click(screen.getByRole("button", { name: "Translate to Turkish" }));

    expect((await screen.findByRole("alert")).textContent).toBe("no API key is configured");
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(screen.getByRole("button", { name: "Translate to Turkish" })).toBeTruthy();
  });
});
