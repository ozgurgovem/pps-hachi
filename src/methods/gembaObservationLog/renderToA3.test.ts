import { describe, expect, it } from "vitest";
import type { A3EntrySummary } from "../../a3/methodContract";
import { renderGembaObservationLogToA3 } from "./renderToA3";

const ENTRY: A3EntrySummary = { id: "e1", title: "Line 3 morning walk" };

describe("renderGembaObservationLogToA3", () => {
  it("exports the title and populated fields as label: value lines, no image slot when the entry has no photo", () => {
    const content = renderGembaObservationLogToA3(
      { date: "2026-08-19", place: "Line 3, station 12", observer: "Ayşe Yılmaz", whatWasSeen: "Idle time at handoff" },
      ENTRY,
    );

    expect(content.lines).toEqual([
      { text: "Line 3 morning walk", bold: true },
      { text: "Date: 2026-08-19" },
      { text: "Place: Line 3, station 12" },
      { text: "Observer: Ayşe Yılmaz" },
      { text: "What was seen: Idle time at handoff" },
    ]);
    expect(content.image).toBeUndefined();
  });

  it("drops blank fields", () => {
    const content = renderGembaObservationLogToA3(
      { date: "", place: "", observer: "", whatWasSeen: "" },
      ENTRY,
    );
    expect(content.lines).toEqual([{ text: "Line 3 morning walk", bold: true }]);
  });

  it("requests the first attached photo as an asset-sourced image, never rasterized", () => {
    const entryWithPhoto: A3EntrySummary = {
      ...ENTRY,
      images: [{ id: "img-1", assetPath: "assets/img_img-1.jpg", thumbnailPath: "assets/thumb_img-1.jpg" }],
    };

    const content = renderGembaObservationLogToA3(
      { date: "", place: "", observer: "", whatWasSeen: "" },
      entryWithPhoto,
    );

    expect(content.image).toEqual({
      kind: "asset-photo",
      spec: undefined,
      source: "asset",
      assetImageId: "img-1",
      rowSpan: 10,
    });
  });

  it("uses Turkish field labels when the entry's language is tr", () => {
    const trEntry: A3EntrySummary = { ...ENTRY, language: "tr" };
    const content = renderGembaObservationLogToA3(
      { date: "2026-08-19", place: "", observer: "", whatWasSeen: "" },
      trEntry,
    );

    expect(content.lines).toEqual([
      { text: "Line 3 morning walk", bold: true },
      { text: "Tarih: 2026-08-19" },
    ]);
  });
});
