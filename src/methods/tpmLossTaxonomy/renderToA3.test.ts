import { describe, expect, it } from "vitest";
import { renderTpmLossTaxonomyToA3 } from "./renderToA3";
import type { TpmLossTaxonomyPayload } from "./schema";

function emptyPayload(): TpmLossTaxonomyPayload {
  const tag = { applies: false, severity: "low" as const };
  return {
    workSafety: { ...tag },
    cost: { ...tag },
    productivity: { ...tag },
    quality: { ...tag },
    maintenance: { ...tag },
    humanResources: { ...tag },
    environment: { ...tag },
  };
}

describe("renderTpmLossTaxonomyToA3", () => {
  it("renders only the applied categories, with their severity, after the bold title", () => {
    const payload: TpmLossTaxonomyPayload = {
      ...emptyPayload(),
      cost: { applies: true, severity: "high" },
      quality: { applies: true, severity: "medium" },
    };
    const content = renderTpmLossTaxonomyToA3(payload, { id: "e1", title: "Scrap increase" });

    expect(content.lines).toEqual([
      { text: "Scrap increase", bold: true },
      { text: "Cost — High" },
      { text: "Quality — Medium" },
    ]);
  });

  it("renders only the title line when no category applies", () => {
    const content = renderTpmLossTaxonomyToA3(emptyPayload(), { id: "e1", title: "Scrap increase" });
    expect(content.lines).toEqual([{ text: "Scrap increase", bold: true }]);
  });

  /** D-188/P-26: `entry.language` picks the category and severity labels. */
  it("uses Turkish category and severity labels when the entry's language is tr", () => {
    const payload: TpmLossTaxonomyPayload = { ...emptyPayload(), cost: { applies: true, severity: "high" } };
    const content = renderTpmLossTaxonomyToA3(payload, { id: "e1", title: "Scrap increase", language: "tr" });

    expect(content.lines).toEqual([
      { text: "Scrap increase", bold: true },
      { text: "Maliyet — Yüksek" },
    ]);
  });
});
