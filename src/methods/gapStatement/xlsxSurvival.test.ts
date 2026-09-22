import { describe, expect, it } from "vitest";
import { buildA3Layout } from "../../a3/buildA3Layout";
import { pps8StepAuto } from "../../a3/templates/pps-8step-auto";
import type { ProjectModel, StepState } from "../../domain/model";
import { getA3ImageRendererMap, getA3RendererMap } from "../registry";
import { GAP_STATEMENT_METHOD_ID } from "./index";

/**
 * ADIM 1 BVVL round (2026-09-16/17): proves the combined chart+bands image
 * survives a real block's geometry end to end through `buildA3Layout`,
 * mirroring `kpiStrip/xlsxSurvival.test.ts`'s own two-call proof. Uses
 * `pps-8step-auto` (D-157's default template) — this design was reviewed
 * and approved against that template's own real scale throughout the BVVL
 * loop.
 *
 * ADIM 1 side-by-side round (2026-09-17): this fixture carries only ONE
 * Step 1 entry — `gapStatement`'s own `widthFraction: 0.5` has no sibling
 * to group with, so `place.ts`'s `groupIntoRuns` falls back to the
 * ungrouped, full-block-width path (`A3BlockContent.widthFraction`'s own
 * doc comment) — this test exercises that solo fallback, not the grouped
 * side-by-side placement. The grouped case (both `gapStatement` and
 * `fiveN1K` present, same row, non-overlapping half-width columns) is
 * proven separately in `l1FiveN1kGapStatementCoexist.probe.test.ts`.
 * `FULL_BLOCK_ROW_SPAN` (12) fits `farplas-7step-tr`'s legacy 14-row ADIM
 * 1 block too (post-regression-fix, see `renderToA3.ts`'s own note), but
 * `pps-8step-auto` stays this test's target since that is the template
 * the design was actually reviewed against.
 */
function emptyStep(): StepState {
  return { entries: [] };
}

function fixtureProject(): ProjectModel {
  return {
    id: "fixture-project-id",
    schemaVersion: 1,
    meta: {
      title: "Kapı Panel Gürültü Problemi",
      projectCode: "KZ-2026-014",
      revision: "A",
      owner: { name: "Ayşe Yılmaz" },
      team: [],
      status: "active",
      openedAt: "2026-01-01T00:00:00.000Z",
      language: "en",
      ai: { enabled: false, redaction: {} },
    },
    templateId: "pps-8step-auto",
    steps: {
      1: {
        entries: [
          {
            id: "gap-statement-entry-1",
            methodId: GAP_STATEMENT_METHOD_ID,
            title: "Leak at final test",
            order: 0,
            a3Visibility: "primary",
            payload: {
              ideal: "Zero leaks",
              actual: "Intermittent leak",
              gap: "3 PPM above ideal",
              gapValue: 3,
              unit: "PPM",
              baselinePeriod: "Q2 2026",
              idealValue: 0,
              actualValue: 3,
              targetDate: "Q3 2026",
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

describe("gapStatement — buildA3Layout two-call survival (BVVL round)", () => {
  it("discovers a pending gap-analysis-chart image slot anchored inside ADIM 1's block on the first call", () => {
    const rendererMap = getA3RendererMap();
    const { pendingImages } = buildA3Layout(fixtureProject(), pps8StepAuto, { rendererMap });

    expect(pendingImages).toHaveLength(1);
    expect(pendingImages[0]).toMatchObject({
      entryId: "gap-statement-entry-1",
      kind: "gap-analysis-chart",
    });
    expect(pendingImages[0]!.heightPt).toBeGreaterThan(0);
    // A solo `widthFraction` entry (no sibling to group with) falls back to
    // the FULL block width (A:L, 495pt) — the same width a pre-side-by-side
    // entry would have gotten, not a half-width column it has no partner to
    // share with.
    expect(pendingImages[0]!.widthPt).toBeCloseTo(495, 1);
  });

  it("resolves a renderer for gap-analysis-chart via the shared registry map", () => {
    const imageRendererMap = getA3ImageRendererMap();
    expect(imageRendererMap["gap-analysis-chart"]).toBeTypeOf("function");
  });

  it("embeds the rasterized chart at the pending slot's exact geometry on the second call", () => {
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
});
