import { describe, expect, it } from "vitest";
import type { FiveN1KDiagramSpec } from "../chartSpec";
import { renderFiveN1KToA3 } from "./renderToA3";
import type { FiveN1KPayload } from "./schema";

function emptyPayload(): FiveN1KPayload {
  return { ne: "", neden: "", nasil: "", kim: "", neZaman: "", nerede: "" };
}

/** BVVL round, ADIM 1 (2026-09-17): replaces D-189/D-224's six-zone table with a hub-and-petal diagram image. */
describe("renderFiveN1KToA3 (BVVL round, five-n1k-diagram)", () => {
  it("emits no top-level lines and exactly one image request", () => {
    const content = renderFiveN1KToA3(emptyPayload(), { id: "e1", title: "5N1K", language: "tr" });

    expect(content.lines).toEqual([]);
    expect(content.zones).toBeUndefined();
    expect(content.image).toBeDefined();
    expect(content.image!.kind).toBe("five-n1k-diagram");
  });

  /**
   * Round 7 follow-up (2026-09-17, Barış's own live block preview
   * screenshot): a fixed `rowSpan: 12` stayed pinned to ADIM 1's own
   * STATIC default even once elastic growth (Faz 11/L3a) pushed the real
   * block far past 12 rows, leaving a huge empty area in the live block
   * preview under two now-tiny images. `rowSpan` is left OMITTED so
   * `place.ts` sizes this to the block's own real, post-elastic row
   * range instead — self-bounding by construction (see `renderToA3.ts`'s
   * own note), not the fixed number this used to be.
   */
  it("declares NO fixed row span (grows with the block's own real, post-elastic height) and a widthFraction to share the block's width", () => {
    const content = renderFiveN1KToA3(emptyPayload(), { id: "e1", title: "5N1K", language: "tr" });
    expect(content.image!.rowSpan).toBeUndefined();
    expect(content.widthFraction).toBe(0.5);
  });

  /**
   * Round 8 follow-up (2026-09-17, Barış's own live block preview
   * screenshot): an omitted `rowSpan` reports Infinite demand to the
   * elastic solver, letting this entry absorb an ENTIRE column's surplus
   * when neighbours are empty — a much larger block than the diagram itself
   * needed. `maxDemandRowSpan` bounds the solver's demand while leaving
   * `rowSpan` itself omitted, so placement still self-bounds safely.
   */
  it("caps the elastic solver's demand at a finite maxDemandRowSpan, without reintroducing a fixed rowSpan", () => {
    const content = renderFiveN1KToA3(emptyPayload(), { id: "e1", title: "5N1K", language: "tr" });
    expect(content.image!.rowSpan).toBeUndefined();
    expect(content.image!.maxDemandRowSpan).toBe(24);
  });

  it("emits exactly six items, in the reference image's own clockwise-from-top order (NOT the Editor's field order)", () => {
    const content = renderFiveN1KToA3(emptyPayload(), { id: "e1", title: "5N1K", language: "tr" });
    const spec = content.image!.spec as FiveN1KDiagramSpec;

    expect(spec.items).toHaveLength(6);
    expect(spec.items.map((item) => item.label)).toEqual(["NE?", "NEDEN?", "NASIL?", "NEREDE?", "NE ZAMAN?", "KİM?"]);
  });

  /** Round 9: the real Farplas design handoff's own two-brand-color ladder, superseding D-165's Layer B for this component. */
  it("gives each item its own round-9 Farplas ladder colour, matching the label order", () => {
    const content = renderFiveN1KToA3(emptyPayload(), { id: "e1", title: "5N1K", language: "tr" });
    const spec = content.image!.spec as FiveN1KDiagramSpec;

    expect(spec.items.map((item) => item.color)).toEqual([
      "#3C3F42",
      "#53565A",
      "#064F58",
      "#077E89",
      "#B21924",
      "#C71C27",
    ]);
  });

  it("trims and forwards each field's own answer to the matching item, in the diagram's own order", () => {
    const payload: FiveN1KPayload = {
      ne: "  Gürültü  ",
      neden: "Rezonans",
      nasil: "",
      kim: "Ayşe Yılmaz",
      neZaman: "Vardiya 2",
      nerede: "Hat 3",
    };
    const content = renderFiveN1KToA3(payload, { id: "e1", title: "5N1K", language: "tr" });
    const spec = content.image!.spec as FiveN1KDiagramSpec;

    expect(spec.items.map((item) => item.answer)).toEqual(["Gürültü", "Rezonans", "", "Hat 3", "Vardiya 2", "Ayşe Yılmaz"]);
  });

  it("uses English question labels for an English-language entry", () => {
    const content = renderFiveN1KToA3(emptyPayload(), { id: "e1", title: "5N1K", language: "en" });
    const spec = content.image!.spec as FiveN1KDiagramSpec;

    expect(spec.items.map((item) => item.label)).toEqual(["WHAT?", "WHY?", "HOW?", "WHERE?", "WHEN?", "WHO?"]);
  });

  it("carries a hub label", () => {
    const content = renderFiveN1KToA3(emptyPayload(), { id: "e1", title: "5N1K", language: "tr" });
    const spec = content.image!.spec as FiveN1KDiagramSpec;
    expect(spec.hubLabel).toBe("5N1K");
  });
});
