import { describe, expect, it } from "vitest";
import { buildA3Layout } from "../../a3/buildA3Layout";
import { farplas7StepTr } from "../../a3/templates/farplas-7step-tr";
import type { ProjectModel, StepState } from "../../domain/model";
import { getA3RendererMap } from "../registry";
import { PARETO_METHOD_ID } from "./index";

/**
 * SPEC.md §6 Phase 5 done-condition + this phase's explicit instruction:
 * Pareto's chart must survive into the xlsx export, proven by extending the
 * existing pattern (`buildA3Layout` → `ImagePlacement` → the Rust fidelity
 * suite reads it back, D-97) rather than a new mechanism. This test proves
 * the TypeScript half — D-102's two-call `buildA3Layout` pattern, exercised
 * against the real Pareto plugin, produces a `pendingImages` slot with
 * correct block geometry, and a second call with a synthetic PNG (the same
 * "prove the pipeline, not pixel content" fixture philosophy `scripts/gen-a3-fixture.ts`
 * already uses) embeds it at that exact anchor. `scripts/gen-a3-fixture.ts`
 * does the equivalent for the checked-in Rust fixture.
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
      2: {
        entries: [
          {
            id: "pareto-entry-1",
            methodId: PARETO_METHOD_ID,
            title: "Hat 3 Pareto",
            order: 0,
            a3Visibility: "primary",
            payload: {
              unit: "adet",
              categories: [
                { id: "c1", label: "Sızdırmazlık", count: 12 },
                { id: "c2", label: "Boya hatası", count: 30 },
              ],
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

describe("Pareto chart — buildA3Layout two-call survival (D-102)", () => {
  it("discovers a pending image slot anchored inside Step 2's block on the first call", () => {
    const rendererMap = getA3RendererMap();
    const { pendingImages } = buildA3Layout(fixtureProject(), farplas7StepTr, { rendererMap });

    expect(pendingImages).toHaveLength(1);
    expect(pendingImages[0]).toMatchObject({
      entryId: "pareto-entry-1",
      kind: "pareto-chart",
      anchorCell: "B24", // Step 2 block starts at row 23; row 23 holds the title line.
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
    expect(second.descriptor.sheets.a3.images[0]!.anchorCell).toBe(first.pendingImages[0]!.anchorCell);
  });
});
