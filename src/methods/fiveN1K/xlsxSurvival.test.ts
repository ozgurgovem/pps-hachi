import { describe, expect, it } from "vitest";
import { buildA3Layout } from "../../a3/buildA3Layout";
import { farplas7StepTr } from "../../a3/templates/farplas-7step-tr";
import type { ProjectModel, StepState } from "../../domain/model";
import { getA3RendererMap } from "../registry";
import { FIVE_N1K_METHOD_ID } from "./index";

/**
 * D-189/P-43: proves the six-zone strip survives Step 1's real geometry
 * (`farplas-7step-tr.ts`'s block 1, columns B:O, rows 8-21) end to end
 * through `buildA3Layout` — the same real-pipeline proof `smartTarget/
 * xlsxSurvival.test.ts` already gives Step 3. This is the regression test
 * for the two D-189 defects `placeZones.ts` fixed this session: a
 * multi-line zone's answer must land in its own cell (not clipped inside a
 * single 30pt row via a joined `\n`), and the trailing "NEREDE?" zone must
 * never be stranded alone on the near-zero-width gutter column O.
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
    templateId: "farplas-7step-tr",
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

describe("5N1K strip — buildA3Layout real-template survival (D-189/P-43)", () => {
  it("writes every zone's answer on its own row, never joined with '\\n' into the label's row", () => {
    const rendererMap = getA3RendererMap();
    const { descriptor } = buildA3Layout(fixtureProject(), farplas7StepTr, { rendererMap });

    const stepOneCells = descriptor.sheets.a3.cells.filter((cell) => {
      const row = Number(cell.ref.match(/\d+/)?.[0]);
      return row >= 8 && row <= 21;
    });

    expect(stepOneCells.some((cell) => cell.value === "NEREDE?")).toBe(true);
    expect(stepOneCells.some((cell) => cell.value === "Hat 3")).toBe(true);
    // Pre-fix, both lines were joined into one cell as "NEREDE?\nHat 3".
    expect(stepOneCells.every((cell) => !String(cell.value).includes("\n"))).toBe(true);
  });

  it("never strands the NEREDE? zone alone on gutter column O — its cells sit on N, merged with O", () => {
    const rendererMap = getA3RendererMap();
    const { descriptor } = buildA3Layout(fixtureProject(), farplas7StepTr, { rendererMap });

    const nereLabelCell = descriptor.sheets.a3.cells.find((cell) => cell.value === "NEREDE?");
    expect(nereLabelCell).toBeDefined();
    expect(nereLabelCell!.ref.startsWith("N")).toBe(true);

    const answerCell = descriptor.sheets.a3.cells.find((cell) => cell.value === "Hat 3");
    expect(answerCell).toBeDefined();
    expect(answerCell!.ref.startsWith("N")).toBe(true);

    const nereRow = nereLabelCell!.ref.match(/\d+/)![0];
    expect(descriptor.sheets.a3.merges).toContainEqual({ range: `N${nereRow}:O${nereRow}` });
    // No cell is ever anchored at the lone O column.
    expect(descriptor.sheets.a3.cells.some((cell) => /^O\d+$/.test(cell.ref))).toBe(false);
  });
});
