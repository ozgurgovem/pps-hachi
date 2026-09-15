import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import i18next from "../../i18n";
import { FishboneDiagram } from "./FishboneDiagram";
import type { FishbonePayload } from "./schema";

const payload: FishbonePayload = {
  categorySet: "4M",
  causes: [{ id: "c1", categoryId: "man", text: "Yorgunluk" }],
};

describe("FishboneDiagram", () => {
  it("interactive mode (no language prop) resolves category labels against the live UI language", async () => {
    await i18next.changeLanguage("tr");
    render(<FishboneDiagram payload={payload} interactive />);
    expect(screen.getByText("İnsan")).toBeDefined();
  });

  /**
   * P-42: the exported/rasterized diagram must follow `project.meta.language`
   * (via the `language` prop), never the editor's own currently-active UI
   * language — the two can diverge (UI set to Turkish while editing an
   * English-content project). Before the fix, `nodeLabel` always called
   * `t()`, so this rendered "İnsan" regardless of `language`.
   */
  it("rasterize mode (language prop set) resolves category labels against project.meta.language, not the active UI language (P-42)", async () => {
    await i18next.changeLanguage("tr");
    render(<FishboneDiagram payload={payload} language="en" />);

    expect(screen.getByText("Man")).toBeDefined();
    expect(screen.queryByText("İnsan")).toBeNull();

    await i18next.changeLanguage("en");
  });
});
