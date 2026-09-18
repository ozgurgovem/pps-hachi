import { describe, expect, it } from "vitest";
import { buildA3Layout } from "../../a3/buildA3Layout";
import { pps8StepAuto } from "../../a3/templates/pps-8step-auto";
import type { ProjectModel, StepState } from "../../domain/model";
import { GENERIC_TEXT_METHOD_ID } from "../genericText";
import { getA3ImageRendererMap, getA3RendererMap } from "../registry";
import { FIVE_N1K_METHOD_ID } from "./index";

/**
 * BVVL round, ADIM 1 (2026-09-17): proves the hub-and-petal diagram
 * survives a real block's geometry end to end through `buildA3Layout`,
 * mirroring `kpiStrip/xlsxSurvival.test.ts`'s own two-call proof. Uses
 * `pps-8step-auto` (D-157's default template, the one this design was
 * reviewed against throughout the BVVL loop).
 *
 * ADIM 1 side-by-side round (2026-09-17): this fixture carries only ONE
 * Step 1 entry — `fiveN1K`'s own `widthFraction: 0.5` has no sibling to
 * group with, so `place.ts`'s `groupIntoRuns` falls back to the ungrouped,
 * full-block-width path (`A3BlockContent.widthFraction`'s own doc
 * comment) — this test exercises that solo fallback, not the grouped
 * side-by-side placement. The grouped case (both `fiveN1K` and
 * `gapStatement` present, same row, non-overlapping half-width columns) is
 * proven separately below and in
 * `l1FiveN1kGapStatementCoexist.probe.test.ts`. `FULL_BLOCK_ROW_SPAN` (12,
 * post-regression-fix — see that constant's own note) fits
 * `farplas-7step-tr`'s legacy 14-row ADIM 1 block too, but `pps-8step-auto`
 * stays this test's target.
 */
function emptyStep(): StepState {
  return { entries: [] };
}

function fixtureProject(): ProjectModel {
  return {
    id: "fixture-project-id",
    schemaVersion: 1,
    meta: {
      title: "Hat 3 Balık Kılçığı Problemi",
      projectCode: "KZ-2026-015",
      revision: "A",
      owner: { name: "Ayşe Yılmaz" },
      team: [],
      status: "active",
      openedAt: "2026-01-01T00:00:00.000Z",
      language: "tr",
      ai: { enabled: false, redaction: {} },
    },
    templateId: "pps-8step-auto",
    steps: {
      1: {
        entries: [
          {
            id: "five-n1k-entry-1",
            methodId: FIVE_N1K_METHOD_ID,
            title: "5N1K",
            order: 0,
            a3Visibility: "primary",
            payload: {
              ne: "Panel gürültüsü",
              neden: "Rezonans",
              nasil: "Titreşim ölçümüyle",
              kim: "Ayşe Yılmaz",
              neZaman: "Vardiya 2",
              nerede: "Hat 3",
            },
            images: [],
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
            provenance: { origin: "human" },
          },
        ],
      },
      2: emptyStep(),
      3: emptyStep(),
      4: emptyStep(),
      5: emptyStep(),
      6: emptyStep(),
      7: emptyStep(),
      8: emptyStep(),
    },
    signOff: {},
    rounds: [],
  };
}

const ONE_PIXEL_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

describe("5N1K diagram — buildA3Layout two-call survival (BVVL round)", () => {
  it("discovers a pending five-n1k-diagram image slot anchored inside ADIM 1's block on the first call", () => {
    const rendererMap = getA3RendererMap();
    const { pendingImages } = buildA3Layout(fixtureProject(), pps8StepAuto, { rendererMap });

    expect(pendingImages).toHaveLength(1);
    expect(pendingImages[0]).toMatchObject({
      entryId: "five-n1k-entry-1",
      kind: "five-n1k-diagram",
    });
    // A solo `widthFraction` entry (no sibling to group with) falls back to
    // the FULL block width (A:L, 567pt) — the same width a pre-side-by-side
    // entry would have gotten, not a half-width column it has no partner to
    // share with.
    expect(pendingImages[0]!.widthPt).toBeCloseTo(567, 1);
    expect(pendingImages[0]!.heightPt).toBeGreaterThan(0);
  });

  it("resolves a renderer for five-n1k-diagram via the shared registry map", () => {
    const imageRendererMap = getA3ImageRendererMap();
    expect(imageRendererMap["five-n1k-diagram"]).toBeTypeOf("function");
  });

  it("embeds the rasterized diagram at the pending slot's exact geometry on the second call", () => {
    const rendererMap = getA3RendererMap();
    const project = fixtureProject();
    const first = buildA3Layout(project, pps8StepAuto, { rendererMap });

    const images = first.pendingImages.map((slot) => ({
      id: `${slot.entryId}-${slot.kind}`,
      data: ONE_PIXEL_PNG_BASE64,
      mimeType: "image/png" as const,
      anchorCell: slot.anchorCell,
      widthPt: slot.widthPt,
      heightPt: slot.heightPt,
    }));

    const second = buildA3Layout(project, pps8StepAuto, { rendererMap, images });

    expect(second.descriptor.sheets.a3.images).toEqual(images);
    expect(second.descriptor.sheets.a3.images[0]!.anchorCell).toBe(first.pendingImages[0]!.anchorCell);
  });

  /**
   * Real-app regression guard (2026-09-17, Barış's own trial run, then the
   * side-by-side round the same day): the two BVVL-approved entries
   * (`fiveN1K` + `gapStatement`) coexist in ADIM 1's same block — verified
   * with ADIM 2/3 both FULLY SATURATED at their own default row count
   * (zero spare rows anywhere in the column to lend), the same worst-case
   * rigor `kpiStrip/kpiStripPps8StepAutoFits.test.ts` (P-63) already
   * established, not just an empty-neighbour best case. Since the two now
   * sit SIDE BY SIDE (`widthFraction: 0.5` each) rather than stacked, ADIM
   * 1's real demand is 12 rows (the MAX of the two, not the sum of the old
   * 4+8 split) — exactly its own default, so this holds *unconditionally*
   * with zero reliance on elastic growth at all, a strictly stronger
   * guarantee than the stacked shape this test originally proved.
   * Mutation-verified: temporarily dropping `fiveN1K`'s own `widthFraction`
   * (the pair no longer groups — `fiveN1K` places full-width first at its
   * own 12 rows, leaving `gapStatement` needing a second, un-lendable
   * 12-row band against a fully saturated column) turned this test
   * genuinely RED (`gap-statement-entry-1` dropped), confirming it is not
   * a vacuous pass.
   */
  it("neither entry drops to the appendix even when ADIM 2/3 leave zero spare rows in the column", () => {
    const rendererMap = getA3RendererMap();
    const project = fixtureProject();
    const gapStatementEntry: StepState["entries"][number] = {
      id: "gap-statement-entry-1",
      methodId: "gap-statement",
      title: "Yüksek fire oranı",
      order: 1,
      a3Visibility: "primary",
      payload: {
        ideal: "İdeal",
        actual: "Mevcut",
        gap: "Problem",
        gapValue: 13.4,
        unit: "%",
        baselinePeriod: "01.08.2026",
        idealValue: 3,
        actualValue: 16.4,
        targetDate: "04.10.2026",
      },
      images: [],
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      provenance: { origin: "human" },
    };
    // ADIM 2's own default is 26 canvas rows (1 title + 25 body saturates
    // it exactly); ADIM 3's own default is 6 (1 title + 5 body).
    function genericTextEntry(id: string, title: string, bodyLineCount: number): StepState["entries"][number] {
      const bodyLines = Array.from({ length: bodyLineCount }, () => "x").join("\n");
      return {
        id,
        methodId: GENERIC_TEXT_METHOD_ID,
        title,
        order: 0,
        a3Visibility: "primary",
        payload: { text: bodyLines },
        images: [],
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        provenance: { origin: "human" },
      };
    }
    const saturatedProject: ProjectModel = {
      ...project,
      steps: {
        ...project.steps,
        1: { entries: [...project.steps[1].entries, gapStatementEntry] },
        2: { entries: [genericTextEntry("adim2-filler", "Veri Analizi", 25)] },
        3: { entries: [genericTextEntry("adim3-filler", "Hedef", 5)] },
      },
    };

    const { descriptor } = buildA3Layout(saturatedProject, pps8StepAuto, { rendererMap });
    const droppedEntryIds = descriptor.overflowWarnings.flatMap((warning) => warning.droppedEntryIds);

    expect(droppedEntryIds).not.toContain("five-n1k-entry-1");
    expect(droppedEntryIds).not.toContain("gap-statement-entry-1");
    expect(droppedEntryIds).not.toContain("adim2-filler");
    expect(droppedEntryIds).not.toContain("adim3-filler");
  });
});
