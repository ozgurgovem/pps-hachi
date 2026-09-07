import { evaluateReadiness } from "../domain/readiness";
import type { ProjectModel, StepId } from "../domain/model";
import type {
  A3LayoutDescriptor,
  CellData,
  ElasticBlockGeometry,
  ImagePlacement,
  MergedRange,
  OverflowWarning,
  ProvisionalBlockMarker,
  SheetDescriptor,
} from "./descriptor";
import { computeBlockBudget } from "./layout/budget";
import { entryLineStyleId } from "./layout/contentStyle";
import { resolveElasticBlocks } from "./layout/elasticAllocation";
import {
  columnWidthsInRange,
  entriesForBlock,
  flattenEntries,
  rowsInBlockRange,
  type EntryWithStep,
} from "./layout/entriesByBlock";
import { computeOverflowWarning } from "./layout/overflow";
import { computeProvisionalBlockMarker } from "./layout/provisional";
import { placeBlockContent, type PendingImageSlot } from "./layout/place";
import { resolveEntryContent, type A3BlockContent, type A3EntryRendererMap, type A3TextLine } from "./methodContract";
import { columnLetterToIndex, parseRange } from "./cellRef";
import type { A3Template } from "./templates/types";

export interface BuildA3LayoutOptions {
  readonly rendererMap: A3EntryRendererMap;
  /**
   * Already-encoded image bytes to place on the A3 sheet. `buildA3Layout` is
   * pure and has no filesystem access (D-04) — resolving `Entry.images`
   * asset paths to bytes, and rasterizing a chart/diagram method's
   * `pendingImages` request to PNG (D-102), are both the (impure) caller's
   * job, done before this is invoked. Empty by default.
   */
  readonly images?: readonly ImagePlacement[];
}

export interface BuildA3LayoutResult {
  readonly descriptor: A3LayoutDescriptor;
  /**
   * D-102: chart/diagram slots discovered while placing content, not yet
   * backed by pixels — geometry only. The caller rasterizes each one's
   * `spec` (impure, off-screen) and calls `buildA3Layout` again with the
   * bytes in `options.images` to get the final, fully-baked descriptor both
   * `HtmlA3Renderer` and the Rust writer consume. Never crosses the Tauri
   * IPC boundary itself — only the final descriptor does. Known gap: an
   * image-bearing entry that overflows to an appendix sheet currently loses
   * its image there (appendix sheets only carry text) — same class of gap
   * as Phase 4's un-ingested `Entry.images` (P-18), not solved this phase.
   */
  readonly pendingImages: readonly PendingImageSlot[];
}

/**
 * D-03/D-04: pure and deterministic — same `project`/`template`/`options`
 * always produce a byte-identical result. No `Date.now()`, no
 * `crypto.randomUUID()`, no `Intl`/locale defaults, no filesystem or network
 * access. This is what makes the golden-file test meaningful.
 */
export function buildA3Layout(
  project: ProjectModel,
  template: A3Template,
  options: BuildA3LayoutOptions,
): BuildA3LayoutResult {
  const allEntries = flattenEntries(project);
  const readinessByStep = evaluateReadiness(project);

  const cells: CellData[] = [];
  const dynamicMerges: MergedRange[] = [];
  const overflowWarnings: OverflowWarning[] = [];
  const provisionalBlocks: ProvisionalBlockMarker[] = [];
  const elasticBlocks: ElasticBlockGeometry[] = [];
  const droppedEntryIds = new Set<string>();
  const pendingImages: PendingImageSlot[] = [];

  cells.push({ ref: topLeft(template.titleRange), value: project.meta.title, styleId: "title" });

  for (const field of template.headerFields) {
    cells.push({
      ref: topLeft(field.labelRange),
      value: field.label,
      styleId: field.labelStyleId,
    });
    const value = resolveHeaderFieldValue(field.id, project);
    if (value) {
      cells.push({ ref: topLeft(field.valueRange), value, styleId: field.valueStyleId });
    }
  }

  for (const field of template.footerFields) {
    cells.push({
      ref: topLeft(field.labelRange),
      value: field.label,
      styleId: field.labelStyleId,
    });
    const value = resolveFooterFieldValue();
    if (value) {
      cells.push({ ref: topLeft(field.valueRange), value, styleId: field.valueStyleId });
    }
  }

  for (const staticCell of template.staticCells) {
    cells.push({ ref: staticCell.ref, value: staticCell.value, styleId: staticCell.styleId });
  }

  // Faz 11/L3a: `.elastic`-declared blocks (`pps-8step-auto` only, D-223
  // madde 1) get their `headerRange`/`contentRows` recomputed for this
  // specific project here — every other block (every `farplas-7step-tr`
  // block) passes through `resolveElasticBlocks` unchanged.
  // Faz 11/L3b (D-170): `project.blockPins` (optional, D-51 — absent on
  // every pre-L3b project) is the one place this map is read; translating
  // it into a `Map` here, rather than passing `project.blockPins` itself,
  // keeps `resolveElasticBlocks` free of any dependency on `ProjectModel`'s
  // own shape (D-03/D-04).
  const pinnedCanvasRowsByStepId = new Map<StepId, number>(
    Object.entries(project.blockPins ?? {}).map(([stepId, rows]) => [Number(stepId) as StepId, rows]),
  );
  const resolvedBlocks = resolveElasticBlocks(
    template,
    allEntries,
    options.rendererMap,
    project.meta.language,
    pinnedCanvasRowsByStepId,
  );

  for (const block of resolvedBlocks) {
    cells.push({
      ref: topLeft(block.headerRange),
      value: block.label,
      styleId: block.headerStyleId,
    });
    if (block.elastic) {
      // Non-elastic blocks keep their header merge in the template's own
      // static `merges` list; an elastic block's header moves per project,
      // so its merge can only be declared here, from the resolved range.
      dynamicMerges.push({ range: block.headerRange });

      // Faz 11/L3b (D-170): the drag-handle overlay's own geometry source —
      // `stepIds[0]` is the same key `resolveElasticBlocks` already reads
      // `pinnedCanvasRowsByStepId` by, so this stays consistent with
      // whichever pin actually drove this block's resolved `contentRows`.
      const stepId = block.appSteps[0];
      const pinnedCanvasRows = stepId === undefined ? undefined : pinnedCanvasRowsByStepId.get(stepId);
      elasticBlocks.push({
        stepIds: block.appSteps,
        contentColumns: block.contentColumns,
        headerRange: block.headerRange,
        contentRows: block.contentRows,
        minimumCanvasRows: block.elastic.minimumCanvasRows,
        ...(pinnedCanvasRows === undefined ? undefined : { pinnedCanvasRows }),
      });
    }

    const blockEntries = entriesForBlock(allEntries, block);
    const contentColumnWidths = columnWidthsInRange(
      template,
      block.contentColumns.first,
      block.contentColumns.last,
    );
    const contentRows = rowsInBlockRange(template, block);
    const placement = placeBlockContent(
      blockEntries,
      block,
      contentRows,
      contentColumnWidths,
      options.rendererMap,
      project.meta.language,
    );

    cells.push(...placement.cells);
    dynamicMerges.push(...placement.merges);
    pendingImages.push(...placement.pendingImages);

    const budget = computeBlockBudget(template, block);
    const warning = computeOverflowWarning(block, budget, placement);
    if (warning) {
      overflowWarnings.push(warning);
      for (const id of warning.droppedEntryIds) {
        droppedEntryIds.add(id);
      }
    }

    const provisionalMarker = computeProvisionalBlockMarker(block, readinessByStep);
    if (provisionalMarker) {
      provisionalBlocks.push(provisionalMarker);
    }
  }

  // Static template merges (`template.merges`) include a whole-row merge for
  // some single-row content blocks (e.g. Step 3's B58:O58) — correct geometry
  // for an empty block or one holding a plain lines-based entry, but D-102's
  // `zones` mechanism can split that same row into narrower merges
  // (SMART Target's B58:F58/M58:O58). rust_xlsxwriter rejects two merges
  // whose ranges partially overlap, so any static merge overlapping a
  // dynamically-placed one is dropped in favor of the dynamic one — never
  // hardcoded to Step 3 or any one method, since any future zoned or
  // otherwise sub-divided block hits the same static/dynamic collision.
  const staticMerges = template.merges.filter(
    (staticMerge) => !dynamicMerges.some((dynamicMerge) => rangesOverlap(staticMerge.range, dynamicMerge.range)),
  );
  const merges: MergedRange[] = [...staticMerges, ...dynamicMerges];

  const a3Sheet: SheetDescriptor = {
    name: "A3",
    columns: template.columns,
    rows: template.rows,
    merges,
    cells,
    images: options.images ?? [],
    pageSetup: {
      paperSize: "A3",
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
      marginsIn: template.marginsIn,
      printArea: template.printArea,
      zoomPercent: template.zoomPercent,
    },
    freezePanes: false,
    gridlinesVisible: false,
  };

  const appendices = buildAppendixSheets(allEntries, droppedEntryIds, options.rendererMap, project.meta.language);

  return {
    descriptor: {
      templateId: template.id,
      language: template.language,
      styles: template.styles,
      sheets: { a3: a3Sheet, appendices },
      overflowWarnings,
      provisionalBlocks,
      elasticBlocks,
    },
    pendingImages,
  };
}

function buildAppendixSheets(
  all: readonly EntryWithStep[],
  droppedEntryIds: ReadonlySet<string>,
  rendererMap: A3EntryRendererMap,
  language: ProjectModel["meta"]["language"],
): readonly SheetDescriptor[] {
  const appendixEntries = all.filter(
    ({ entry }) => entry.a3Visibility === "appendix" || droppedEntryIds.has(entry.id),
  );

  return appendixEntries.map(({ entry }, index) => {
    const content = resolveEntryContent(
      entry.methodId,
      entry.payload,
      { id: entry.id, title: entry.title, language },
      rendererMap,
    );

    const appendixLines = flattenContentForAppendix(content);

    const cells: CellData[] = [
      { ref: "B2", value: entry.title, styleId: "entryContentBold" },
      ...appendixLines.map((line, lineIndex) => ({
        ref: `B${4 + lineIndex}`,
        value: line.text,
        styleId: entryLineStyleId(line.bold, line.tone),
      })),
    ];

    return {
      name: `Appendix A${index + 1}`,
      columns: [{ key: "A", charWidth: 2 }, { key: "B", charWidth: 80 }],
      rows: [
        { index: 2, heightPt: 24 },
        ...appendixLines.map((_, lineIndex) => ({ index: 4 + lineIndex, heightPt: 20 })),
      ],
      merges: [],
      cells,
      images: [],
      pageSetup: {
        paperSize: "A3" as const,
        orientation: "landscape" as const,
        fitToPage: true as const,
        fitToWidth: 1 as const,
        fitToHeight: 1 as const,
        marginsIn: { top: 0.1969, bottom: 0.1969, left: 0.2362, right: 0.2362 },
        printArea: "A1:B100",
        zoomPercent: 100,
      },
      freezePanes: false as const,
      gridlinesVisible: false as const,
    };
  });
}

/**
 * SPEC.md §2.3 ("the export must never silently truncate content") applied
 * to D-102's non-text content shapes. An appendix sheet carries text only,
 * but a method whose content lives entirely in `zones` (SMART Target, whose
 * `renderToA3` returns `lines: []` by design) would otherwise appendix as a
 * completely blank sheet — losing the very content the appendix exists to
 * preserve. Zone text is flattened in reading order; a chart/diagram is
 * noted as a placeholder line rather than silently vanishing, since an
 * appendix sheet has no image placement of its own yet (see P-20).
 */
function flattenContentForAppendix(content: A3BlockContent): readonly A3TextLine[] {
  const lines: A3TextLine[] = [...content.lines];

  if (content.image) {
    lines.push({ text: `[${content.image.kind}]` });
  }

  for (const zone of content.zones ?? []) {
    lines.push(...(zone.lines ?? []));
    if (zone.image) {
      lines.push({ text: `[${zone.image.kind}]` });
    }
  }

  return lines;
}

function topLeft(range: string): string {
  return range.split(":")[0] ?? range;
}

function rangesOverlap(a: string, b: string): boolean {
  const rangeA = parseRange(a);
  const rangeB = parseRange(b);
  const colsOverlap =
    columnLetterToIndex(rangeA.start.column) <= columnLetterToIndex(rangeB.end.column) &&
    columnLetterToIndex(rangeB.start.column) <= columnLetterToIndex(rangeA.end.column);
  const rowsOverlap = rangeA.start.row <= rangeB.end.row && rangeB.start.row <= rangeA.end.row;
  return colsOverlap && rowsOverlap;
}

/**
 * Faz 11/L1 (D-223, §13.2's own dictionaries): `priority`/`generalRag`
 * store a plain internal code (`"high"`, `"amber"`, …) so the schema stays
 * permissive (D-51) — the export needs a human-readable label in the
 * project's own export language, and `src/a3` cannot import i18next (D-43),
 * so this is a small local bilingual dictionary, the same pattern
 * `gapStatement`/`smartTarget`/etc.'s own `renderToA3.ts` files already use.
 */
const PRIORITY_LABELS: Readonly<Record<string, Readonly<Record<"tr" | "en", string>>>> = {
  critical: { tr: "Kritik", en: "Critical" },
  high: { tr: "Yüksek", en: "High" },
  medium: { tr: "Orta", en: "Medium" },
  low: { tr: "Düşük", en: "Low" },
};

const GENERAL_RAG_LABELS: Readonly<Record<string, Readonly<Record<"tr" | "en", string>>>> = {
  red: { tr: "Kırmızı", en: "Red" },
  amber: { tr: "Sarı", en: "Amber" },
  green: { tr: "Yeşil", en: "Green" },
};

function resolveHeaderFieldValue(fieldId: string, project: ProjectModel): string {
  const language = project.meta.language;
  switch (fieldId) {
    // farplas-7step-tr's own field ids (unchanged since Phase 4).
    case "champion":
      return project.meta.owner.name;
    case "kaizenNo":
      return project.meta.projectCode;
    case "department":
      return project.meta.department ?? "";
    // pps-8step-auto's own field ids (Faz 11/L1, D-153).
    case "ppsId":
      return project.meta.projectCode;
    case "problemTitle":
      return project.meta.title;
    case "problemOwner":
      return project.meta.owner.name;
    case "customer":
      return project.meta.customer ?? "";
    case "line":
      return project.meta.line ?? "";
    case "priority": {
      const priority = project.meta.priority;
      return priority ? (PRIORITY_LABELS[priority]?.[language] ?? priority) : "";
    }
    case "partNumber":
      return project.meta.partNumber ?? "";
    case "openedAt":
      return project.meta.openedAt.slice(0, 10);
    case "revision":
      return project.meta.revision;
    case "targetClosureDate":
      return project.meta.targetClosureDate ?? "";
    case "generalRag": {
      const rag = project.meta.generalRag;
      return rag ? (GENERAL_RAG_LABELS[rag]?.[language] ?? rag) : "";
    }
    default:
      return "";
  }
}

/**
 * D-96: none of `TR_FOOTER_FIELDS` has a distinct value cell in the source
 * form (§4/§9.1) — the label *is* the cell; sign-off is a wet-ink signature
 * next to it on paper. `ProjectModel.signOff` has nowhere faithful to land
 * in the export yet, so this always returns blank. Kept as its own function
 * (rather than deleted) so the seam is obvious when a future phase adds a
 * real signature/approval block to the template.
 */
function resolveFooterFieldValue(): string {
  return "";
}
