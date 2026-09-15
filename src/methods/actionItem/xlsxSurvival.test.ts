import { describe, expect, it } from "vitest";
import { buildA3Layout } from "../../a3/buildA3Layout";
import { pps8StepAuto } from "../../a3/templates/pps-8step-auto";
import type { ProjectModel, StepState } from "../../domain/model";
import { getA3BlockAggregateImageMap, getA3ImageRendererMap, getA3RendererMap } from "../registry";
import { ACTION_ITEM_METHOD_ID } from "./index";

/**
 * P-22/D-270: unlike every other `xlsxSurvival.test.ts` in this codebase,
 * `action-item`'s image comes from `getA3BlockAggregateImageMap()` — the
 * new, unrelated-to-D-102 mechanism, not `getA3ImageRendererMap()`'s own
 * `A3BlockContent.image` request. This proves the *new* registration
 * (`MethodPlugin.blockAggregateImage`) resolves end-to-end through the real
 * registry and the real `buildA3Layout` two-call pattern (D-102), not just
 * that the plugin file looks complete when read.
 *
 * Uses `pps-8step-auto` (not `farplas-7step-tr`): the template's own Step 6
 * block is `.elastic` (Faz 11/L3a), so this is also the real proof that
 * `elasticAllocation.ts`'s own demand estimate (fixed this same session,
 * P-22/D-270) actually grows the block enough to fit BOTH action-item
 * entries' full text AND the chart's own reserved rows — `farplas-7step-tr`'s
 * static Step 5+6 block is too small for two real, fully-filled action-item
 * entries plus a 6-row chart, and would silently overflow the second one.
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
    templateId: "pps-8step-auto",
    steps: {
      1: emptyStep(),
      2: emptyStep(),
      3: emptyStep(),
      4: emptyStep(),
      5: emptyStep(),
      6: {
        entries: [
          {
            id: "action-1",
            methodId: ACTION_ITEM_METHOD_ID,
            title: "Kalıp bakım planı güncelle",
            order: 0,
            a3Visibility: "primary",
            payload: {
              action: "Kalıp bakım planı güncelle",
              owner: "Ahmet",
              startDate: "2026-09-01",
              dueDate: "2026-09-10",
              percentComplete: "",
              evidence: "",
              customerApproval: "",
            },
            images: [],
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
            provenance: { origin: "human" },
          },
          {
            id: "action-2",
            methodId: ACTION_ITEM_METHOD_ID,
            title: "Operatör eğitimi",
            order: 1,
            a3Visibility: "primary",
            payload: {
              action: "Operatör eğitimi",
              owner: "Fatma",
              startDate: "2026-09-05",
              dueDate: "2026-09-15",
              percentComplete: "",
              evidence: "",
              customerApproval: "",
            },
            images: [],
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
            provenance: { origin: "human" },
          },
        ],
      },
      7: emptyStep(),
      8: emptyStep(),
    },
    signOff: {},
    rounds: [],
  };
}

const ONE_PIXEL_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

describe("action-item — block-level aggregate Gantt, buildA3Layout two-call survival (D-102, P-22/D-270)", () => {
  it("discovers exactly ONE pending gantt-chart image slot for the block, built from BOTH action-item entries", () => {
    const rendererMap = getA3RendererMap();
    const aggregateImageMap = getA3BlockAggregateImageMap();
    const { pendingImages } = buildA3Layout(fixtureProject(), pps8StepAuto, { rendererMap, aggregateImageMap });

    const ganttSlots = pendingImages.filter((slot) => slot.kind === "action-gantt-chart");
    expect(ganttSlots).toHaveLength(1);
    expect(ganttSlots[0]!.spec).toMatchObject({
      kind: "gantt-chart",
      items: [
        { id: "action-1", label: "Kalıp bakım planı güncelle", startDate: "2026-09-01", dueDate: "2026-09-10" },
        { id: "action-2", label: "Operatör eğitimi", startDate: "2026-09-05", dueDate: "2026-09-15" },
      ],
    });
    expect(ganttSlots[0]!.widthPt).toBeGreaterThan(0);
    expect(ganttSlots[0]!.heightPt).toBeGreaterThan(0);
  });

  it("resolves a renderer for action-gantt-chart via the shared registry map (reusing the existing imageKind/renderImage dispatch, D-102)", () => {
    const imageRendererMap = getA3ImageRendererMap();
    expect(imageRendererMap["action-gantt-chart"]).toBeTypeOf("function");
  });

  it("embeds the rasterized chart at the pending slot's exact geometry on the second call", () => {
    const rendererMap = getA3RendererMap();
    const aggregateImageMap = getA3BlockAggregateImageMap();
    const project = fixtureProject();
    const first = buildA3Layout(project, pps8StepAuto, { rendererMap, aggregateImageMap });

    const images = first.pendingImages.map((slot) => ({
      id: `${slot.entryId}-${slot.kind}`,
      data: ONE_PIXEL_PNG_BASE64,
      mimeType: "image/png" as const,
      anchorCell: slot.anchorCell,
      widthPt: slot.widthPt,
      heightPt: slot.heightPt,
    }));

    const second = buildA3Layout(project, pps8StepAuto, { rendererMap, aggregateImageMap, images });

    expect(second.descriptor.sheets.a3.images).toEqual(images);
    const ganttImage = second.descriptor.sheets.a3.images.find((image) => image.id.includes("action-gantt-chart"));
    expect(ganttImage?.anchorCell).toBe(first.pendingImages.find((slot) => slot.kind === "action-gantt-chart")?.anchorCell);
  });
});
