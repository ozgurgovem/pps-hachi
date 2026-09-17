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

  it("declares a fixed row span that fits ADIM 1's own default budget unconditionally, no elastic growth needed", () => {
    const content = renderFiveN1KToA3(emptyPayload(), { id: "e1", title: "5N1K", language: "tr" });
    expect(content.image!.rowSpan).toBe(4);
  });

  it("emits exactly six items, in the reference image's own clockwise-from-top order (NOT the Editor's field order)", () => {
    const content = renderFiveN1KToA3(emptyPayload(), { id: "e1", title: "5N1K", language: "tr" });
    const spec = content.image!.spec as FiveN1KDiagramSpec;

    expect(spec.items).toHaveLength(6);
    expect(spec.items.map((item) => item.label)).toEqual(["NE?", "NEDEN?", "NASIL?", "NEREDE?", "NE ZAMAN?", "KİM?"]);
  });

  it("gives each item its own D-165 Layer B colour, matching the label order", () => {
    const content = renderFiveN1KToA3(emptyPayload(), { id: "e1", title: "5N1K", language: "tr" });
    const spec = content.image!.spec as FiveN1KDiagramSpec;

    expect(spec.items.map((item) => item.color)).toEqual([
      "#C68A2E",
      "#5F4470",
      "#2F7A6E",
      "#556677",
      "#8A5A3B",
      "#8B3A5C",
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
