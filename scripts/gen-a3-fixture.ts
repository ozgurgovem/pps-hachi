/**
 * D-62-style fixture generator: writes the REAL descriptor `buildA3Layout`
 * produces (not a hand-written Rust approximation of what it might look
 * like) to `src-tauri/tests/fixtures/a3-layout-descriptor.json`, checked
 * into git. The Rust round-trip/fidelity test (`src-tauri/tests/xlsx.rs`)
 * reads this exact file — if it's regenerated, the Rust test regenerates
 * its own expectations against the same run.
 *
 * Phase 5 (D-102): exercises the real method registry — including Pareto,
 * Trend, Fishbone and SMART Target, whose `renderToA3` requests a
 * chart/diagram image — through the production two-call `buildA3Layout`
 * pattern (discover `pendingImages`, "rasterize" with a synthetic PNG since
 * this script has no DOM/canvas, call again with `options.images`). This is
 * the same "prove the pipeline, not pixel content" fixture philosophy
 * Phase 4 already used for its one synthetic image.
 *
 * Run with: npx vite-node scripts/gen-a3-fixture.ts
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";
import { buildA3Layout } from "../src/a3/buildA3Layout";
import type { ImagePlacement } from "../src/a3/descriptor";
import { farplas7StepTr } from "../src/a3/templates/farplas-7step-tr";
import type { ProjectModel, StepState } from "../src/domain/model";
import { getA3RendererMap } from "../src/methods/registry";

const CRC_TABLE = buildCrc32Table();

function buildCrc32Table(): Uint32Array {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
}

function crc32(bytes: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff]! ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBytes = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])));
  return Buffer.concat([length, typeBytes, data, crc]);
}

/**
 * A valid, minimal 1x1 RGB PNG carrying the given color, base64-encoded.
 * Real charts differ in pixel content between images; a fixture that reused
 * one byte-identical placeholder across every slot would let
 * `rust_xlsxwriter`'s real media-deduplication (same bytes -> one physical
 * file, many drawing anchors — correct OOXML behavior) collapse N descriptor
 * images into 1 media file, defeating this fixture's job of exercising
 * "N images in, N media files out" (`xlsx.rs`'s
 * `embedded_images_land_in_the_workbook_as_real_media`).
 */
function onePixelPngBase64(r: number, g: number, b: number): string {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrData = Buffer.from([0, 0, 0, 1, 0, 0, 0, 1, 8, 2, 0, 0, 0]);
  const idatData = deflateSync(Buffer.from([0, r, g, b]));
  return Buffer.concat([
    signature,
    pngChunk("IHDR", ihdrData),
    pngChunk("IDAT", idatData),
    pngChunk("IEND", Buffer.alloc(0)),
  ]).toString("base64");
}

const rendererMap = getA3RendererMap();

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
    2: {
      entries: [
        fixtureEntry({
          id: "s2-e1",
          methodId: "pareto",
          title: "Hat 3 Pareto",
          payload: {
            unit: "adet",
            categories: [
              { id: "c1", label: "Sızdırmazlık", count: 12 },
              { id: "c2", label: "Boya hatası", count: 30 },
            ],
          },
        }),
        fixtureEntry({
          id: "s2-e2",
          methodId: "trend",
          title: "Hat 3 Trend",
          order: 1,
          payload: {
            unit: "PPM",
            points: [
              { id: "p1", label: "Hafta 1", value: 120 },
              { id: "p2", label: "Hafta 2", value: 80 },
            ],
            targetValue: 20,
            targetLabel: "Hedef",
            events: [{ label: "Kalıp değişti", at: "Hafta 2" }],
          },
        }),
      ],
    },
    3: {
      // D-38: the SMART Target entry's zones always claim the block's whole
      // remaining budget by construction (never partial), so a second Step
      // 3 entry is guaranteed to overflow — this is what keeps
      // `every_dropped_entry_id_is_recoverable_from_an_appendix` (xlsx.rs)
      // exercising a real drop after Phase 5, the same way the original
      // single generic-text "Hedef" entry did before smart-target existed.
      entries: [
        fixtureEntry({
          id: "s3-e1",
          methodId: "smart-target",
          title: "Hedef Kartı",
          payload: {
            metric: "Gürültü PPM",
            baseline: 120,
            target: 20,
            unit: "PPM",
            dueDate: "2026-09-01",
            owner: "Ayşe Yılmaz",
            prioritizedItems: [{ id: "i1", text: "Panel rezonansını azalt" }],
            stakeholderNote: "Üretim müdürü onayladı.",
          },
        }),
        fixtureEntry({
          id: "s3-e2",
          title: "Hedef",
          order: 1,
          payload: { text: "Gürültü seviyesini 4 haftada %90 azalt." },
        }),
      ],
    },
    4: {
      entries: [
        fixtureEntry({
          id: "s4-e1",
          methodId: "fishbone",
          title: "Hat 3 Balık Kılçığı",
          payload: {
            categorySet: "4M",
            causes: [{ id: "fc1", categoryId: "machine", text: "Aşınmış kalıp" }],
          },
        }),
      ],
    },
    5: emptyStep(),
    6: emptyStep(),
    7: emptyStep(),
    8: emptyStep(),
  },
  signOff: {},
  rounds: [],
};

const first = buildA3Layout(project, farplas7StepTr, { rendererMap });

const images: ImagePlacement[] = [
  {
    id: "img-1",
    data: onePixelPngBase64(0xaa, 0x00, 0x00),
    mimeType: "image/png",
    anchorCell: "B9",
    widthPt: 40,
    heightPt: 30,
  },
  ...first.pendingImages.map((slot, index) => ({
    id: `${slot.entryId}-${slot.kind}`,
    // Index-derived color keeps every slot's bytes distinct from the others
    // and from img-1 above — see onePixelPngBase64's doc comment.
    data: onePixelPngBase64(0x10 * (index + 1), 0x40, 0xff - 0x10 * (index + 1)),
    mimeType: "image/png" as const,
    anchorCell: slot.anchorCell,
    widthPt: slot.widthPt,
    heightPt: slot.heightPt,
  })),
];

const { descriptor } = buildA3Layout(project, farplas7StepTr, { rendererMap, images });

const outPath = fileURLToPath(
  new URL("../src-tauri/tests/fixtures/a3-layout-descriptor.json", import.meta.url),
);
writeFileSync(outPath, JSON.stringify(descriptor, null, 2) + "\n");
console.log(`Wrote ${outPath} (${images.length} embedded images, ${first.pendingImages.length} from chart/diagram methods)`);
