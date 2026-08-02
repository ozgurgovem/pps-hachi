/**
 * D-62-style fixture generator: writes the REAL descriptor `buildA3Layout`
 * produces (not a hand-written Rust approximation of what it might look
 * like) to `src-tauri/tests/fixtures/a3-layout-descriptor.json`, checked
 * into git. The Rust round-trip/fidelity test (`src-tauri/tests/xlsx.rs`)
 * reads this exact file — if it's regenerated, the Rust test regenerates
 * its own expectations against the same run.
 *
 * Run with: npx vite-node scripts/gen-a3-fixture.ts
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { buildA3Layout } from "../src/a3/buildA3Layout";
import type { A3EntryRendererMap } from "../src/a3/methodContract";
import { farplas7StepTr } from "../src/a3/templates/farplas-7step-tr";
import type { ProjectModel, StepState } from "../src/domain/model";

// A well-known minimal valid 1x1 PNG, used only to prove image placement
// round-trips through the descriptor -> Rust writer -> a real xlsx file.
const ONE_PIXEL_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

const rendererMap: A3EntryRendererMap = {
  "generic-text": (payload, entry) => {
    const text = (payload as { text: string }).text;
    return { lines: [{ text: entry.title, bold: true }, { text }] };
  },
};

function emptyStep(): StepState {
  return { entries: [] };
}

function fixtureEntry(overrides: Record<string, unknown>) {
  return {
    id: "entry-1",
    methodId: "generic-text",
    title: "Problem Tanımı",
    order: 0,
    a3Visibility: "primary" as const,
    payload: { text: "Ön kapı panelinde gürültü tespit edildi." },
    images: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    provenance: { origin: "human" as const },
    ...overrides,
  };
}

const project: ProjectModel = {
  id: "fixture-project-id",
  schemaVersion: 1,
  meta: {
    title: "Kapı Panel Gürültü Problemi",
    projectCode: "KZ-2026-014",
    revision: "A",
    department: "Kalite",
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
        fixtureEntry({ id: "s1-e1", title: "Problem Tanımı" }),
        fixtureEntry({
          id: "s1-e2",
          title: "Ek Bilgi",
          order: 1,
          a3Visibility: "appendix",
          payload: { text: "Bu detay ek olarak taşınmalı." },
        }),
      ],
    },
    2: emptyStep(),
    3: {
      entries: [
        fixtureEntry({
          id: "s3-e1",
          title: "Hedef",
          payload: { text: "Gürültü seviyesini 4 haftada %90 azalt." },
        }),
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

const descriptor = buildA3Layout(project, farplas7StepTr, {
  rendererMap,
  images: [
    {
      id: "img-1",
      data: ONE_PIXEL_PNG_BASE64,
      mimeType: "image/png",
      anchorCell: "B9",
      widthPt: 40,
      heightPt: 30,
    },
  ],
});

const outPath = fileURLToPath(
  new URL("../src-tauri/tests/fixtures/a3-layout-descriptor.json", import.meta.url),
);
writeFileSync(outPath, JSON.stringify(descriptor, null, 2) + "\n");
console.log(`Wrote ${outPath}`);
