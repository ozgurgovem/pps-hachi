import { columnLetterToIndex, parseRange } from "./cellRef";
import { evaluateReadiness } from "../domain/readiness";
import { STEP_IDS, type Entry, type ProjectModel, type StepId } from "../domain/model";
import type {
  A3LayoutDescriptor,
  CellData,
  ImagePlacement,
  MergedRange,
  OverflowWarning,
  ProvisionalBlockMarker,
  RowDef,
  SheetDescriptor,
} from "./descriptor";
import { computeBlockBudget } from "./layout/budget";
import { entryLineStyleId, type ColumnWidth } from "./layout/contentStyle";
import { excelColumnWidthToPt } from "./layout/measure";
import { computeOverflowWarning } from "./layout/overflow";
import { computeProvisionalBlockMarker } from "./layout/provisional";
import { placeBlockContent, type PendingImageSlot } from "./layout/place";
import type { A3BlockContent, A3EntryRendererMap, A3TextLine } from "./methodContract";
import type { A3Template, TemplateBlock } from "./templates/types";

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

  for (const block of template.blocks) {
    cells.push({
      ref: topLeft(block.headerRange),
      value: block.label,
      styleId: block.headerStyleId,
    });

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
    },
    pendingImages,
  };
}

interface EntryWithStep {
  readonly entry: Entry;
  readonly stepId: StepId;
}

function flattenEntries(project: ProjectModel): readonly EntryWithStep[] {
  const result: EntryWithStep[] = [];
  for (const stepId of STEP_IDS) {
    const step = project.steps[stepId];
    if (!step) {
      continue;
    }
    for (const entry of step.entries) {
      result.push({ entry, stepId });
    }
  }
  return result;
}

function entriesForBlock(all: readonly EntryWithStep[], block: TemplateBlock): readonly Entry[] {
  return all
    .filter(
      ({ entry, stepId }) =>
        block.appSteps.includes(stepId) && entry.a3Visibility === "primary",
    )
    .sort((a, b) => a.entry.order - b.entry.order)
    .map(({ entry }) => entry);
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
    const renderer = rendererMap[entry.methodId];
    const content = renderer
      ? renderer(entry.payload, { id: entry.id, title: entry.title, language })
      : { lines: [{ text: entry.title, bold: true }] };

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

function columnWidthsInRange(
  template: A3Template,
  firstKey: string,
  lastKey: string,
): readonly ColumnWidth[] {
  const firstIndex = template.columns.findIndex((column) => column.key === firstKey);
  const lastIndex = template.columns.findIndex((column) => column.key === lastKey);
  return template.columns.slice(firstIndex, lastIndex + 1).map((column) => ({
    key: column.key,
    widthPt: excelColumnWidthToPt(column.charWidth),
  }));
}

function rowsInBlockRange(template: A3Template, block: TemplateBlock): readonly RowDef[] {
  return template.rows.filter(
    (row) => row.index >= block.contentRows.start && row.index <= block.contentRows.end,
  );
}

function resolveHeaderFieldValue(fieldId: string, project: ProjectModel): string {
  switch (fieldId) {
    case "champion":
      return project.meta.owner.name;
    case "kaizenNo":
      return project.meta.projectCode;
    case "department":
      return project.meta.department ?? "";
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
