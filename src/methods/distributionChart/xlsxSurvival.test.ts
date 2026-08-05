import { describe, expect, it } from "vitest";
import { buildA3Layout } from "../../a3/buildA3Layout";
import { farplas7StepTr } from "../../a3/templates/farplas-7step-tr";
import type { ProjectModel, StepState } from "../../domain/model";
import { getA3RendererMap } from "../registry";
import { DISTRIBUTION_CHART_METHOD_ID } from "./index";

/**
 * Same D-102 two-call survival proof as `pareto/xlsxSurvival.test.ts` —
 * the pipeline, not pixel content. Phase 6c's own instruction was explicit:
 * verify the new image kind through `place.ts`/`rasterize.ts` with a real
 * PROBE test, not just by reading the code — this is the TypeScript half;
 * `distributionChartTwoEntries.probe.test.ts` covers the specific two-image
 * concurrency-class hazard D-105/D-113/D-136 already found real bugs in.
 */
function emptyStep(): StepState {
  return { entries: [] };
}

function fixtureProject(): ProjectModel {
  return {
    id: "fixture-project-id",
    schemaVersion: 1,
    meta: {
      title: "Duvar Kalınlığı Dağılımı",
      projectCode: "KZ-2026-020",
      revision: "A",
      owner: { name: "Ayşe Yılmaz" },
      team: [],
      status: "active",
      openedAt: "2026-01-01T00:00:00.000Z",
      language: "tr",
      ai: { enabled: false, redaction: {} },
    },
    templateId: "farplas-7step-tr",
    steps: {
      1: emptyStep(),
      2: {
        entries: [
          {
            id: "distribution-entry-1",
            methodId: DISTRIBUTION_CHART_METHOD_ID,
            title: "Kalınlık histogramı",
            order: 0,
            a3Visibility: "primary",
            payload: {
              chartType: "histogram",
              unit: "mm",
              binCount: "",
              samples: [
                { id: "s1", value: "1.1" },
                { id: "s2", value: "1.3" },
                { id: "s3", value: "1.5" },
              ],
              points: [],
            },
            images: [],
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
            provenance: { origin: "human" },
          },
        ],
      },
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

describe("Distribution chart — buildA3Layout two-call survival (D-102)", () => {
  it("discovers a pending image slot anchored inside Step 2's block on the first call", () => {
    const rendererMap = getA3RendererMap();
    const { pendingImages } = buildA3Layout(fixtureProject(), farplas7StepTr, { rendererMap });

    expect(pendingImages).toHaveLength(1);
    expect(pendingImages[0]).toMatchObject({
      entryId: "distribution-entry-1",
      kind: "distribution-chart",
    });
    expect(pendingImages[0]!.widthPt).toBeGreaterThan(0);
    expect(pendingImages[0]!.heightPt).toBeGreaterThan(0);
  });

  it("embeds the rasterized chart at the pending slot's exact geometry on the second call", () => {
    const rendererMap = getA3RendererMap();
    const project = fixtureProject();
    const first = buildA3Layout(project, farplas7StepTr, { rendererMap });

    const images = first.pendingImages.map((slot) => ({
      id: `${slot.entryId}-${slot.kind}`,
      data: ONE_PIXEL_PNG_BASE64,
      mimeType: "image/png" as const,
      anchorCell: slot.anchorCell,
      widthPt: slot.widthPt,
      heightPt: slot.heightPt,
    }));

    const second = buildA3Layout(project, farplas7StepTr, { rendererMap, images });

    expect(second.descriptor.sheets.a3.images).toEqual(images);
  });
});
