import { describe, expect, it } from "vitest";
import { buildA3Layout } from "../../a3/buildA3Layout";
import { farplas7StepTr } from "../../a3/templates/farplas-7step-tr";
import type { ProjectModel, StepState } from "../../domain/model";
import { getA3RendererMap } from "../registry";
import { SMART_TARGET_METHOD_ID } from "./index";

/**
 * D-38/D-102: proves the three-zone strip survives Step 3's real geometry —
 * one 153.75pt content row (`farplas-7step-tr.ts`'s block 3) — end to end
 * through `buildA3Layout`'s two-call pattern, the same way
 * `pareto/xlsxSurvival.test.ts` proves the vertical-stack image path.
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
      language: "tr",
      ai: { enabled: false, redaction: {} },
    },
    templateId: "farplas-7step-tr",
    steps: {
      1: emptyStep(),
      2: emptyStep(),
      3: {
        entries: [
          {
            id: "smart-target-entry-1",
            methodId: SMART_TARGET_METHOD_ID,
            title: "Hedef",
            order: 0,
            a3Visibility: "primary",
            payload: {
              metric: "Gürültü PPM",
              baseline: 120,
              target: 20,
              unit: "PPM",
              dueDate: "2026-09-01",
              owner: "Ayşe Yılmaz",
              prioritizedItems: [{ id: "i1", text: "Panel rezonansını azalt" }],
              stakeholderNote: "",
            },
            images: [],
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
            provenance: { origin: "human" },
          },
        ],
      },
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

describe("SMART Target trajectory chart — buildA3Layout two-call survival (D-102/D-38)", () => {
  it("discovers a pending image slot for zone B, anchored inside Step 3's single content row", () => {
    const rendererMap = getA3RendererMap();
    const { pendingImages } = buildA3Layout(fixtureProject(), farplas7StepTr, { rendererMap });

    expect(pendingImages).toHaveLength(1);
    expect(pendingImages[0]).toMatchObject({ entryId: "smart-target-entry-1", kind: "trajectory-chart" });
    // Row 58 is Step 3's one content row (153.75pt) — the zone's height must
    // equal the row's full height, not a fabricated multi-row sum.
    expect(pendingImages[0]!.heightPt).toBe(153.75);
    expect(pendingImages[0]!.widthPt).toBeGreaterThan(0);
  });

  it("also places the zone A prioritised-items text and the zone C mono line as real cells", () => {
    const rendererMap = getA3RendererMap();
    const { descriptor } = buildA3Layout(fixtureProject(), farplas7StepTr, { rendererMap });

    const row58Cells = descriptor.sheets.a3.cells.filter((cell) => cell.ref.endsWith("58"));
    const values = row58Cells.map((cell) => cell.value);
    expect(values.some((value) => typeof value === "string" && value.includes("Hedef"))).toBe(true);
    expect(
      values.some(
        (value) => typeof value === "string" && value.includes("Baseline: 120") && value.includes("Owner: Ayşe Yılmaz"),
      ),
    ).toBe(true);
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
