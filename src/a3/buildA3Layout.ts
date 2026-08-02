import { STEP_IDS, type Entry, type ProjectModel, type StepId } from "../domain/model";
import type {
  A3LayoutDescriptor,
  CellData,
  ImagePlacement,
  MergedRange,
  OverflowWarning,
  SheetDescriptor,
} from "./descriptor";
import { computeBlockBudget } from "./layout/budget";
import { excelColumnWidthToPt } from "./layout/measure";
import { computeOverflowWarning } from "./layout/overflow";
import { placeBlockContent } from "./layout/place";
import type { A3EntryRendererMap } from "./methodContract";
import type { A3Template, TemplateBlock } from "./templates/types";

export interface BuildA3LayoutOptions {
  readonly rendererMap: A3EntryRendererMap;
  /**
   * Already-encoded image bytes to place on the A3 sheet. `buildA3Layout` is
   * pure and has no filesystem access (D-04) — resolving `Entry.images`
   * asset paths to bytes is the (impure) caller's job, done before this is
   * invoked. Empty by default; Phase 4 does not yet ingest photos from
   * entries — see DECISIONS.md.
   */
  readonly images?: readonly ImagePlacement[];
}

/**
 * D-03/D-04: pure and deterministic — same `project`/`template`/`options`
 * always produce a byte-identical descriptor. No `Date.now()`, no
 * `crypto.randomUUID()`, no `Intl`/locale defaults, no filesystem or network
 * access. This is what makes the golden-file test meaningful.
 */
export function buildA3Layout(
  project: ProjectModel,
  template: A3Template,
  options: BuildA3LayoutOptions,
): A3LayoutDescriptor {
  const allEntries = flattenEntries(project);

  const cells: CellData[] = [];
  const merges: MergedRange[] = [...template.merges];
  const overflowWarnings: OverflowWarning[] = [];
  const droppedEntryIds = new Set<string>();

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
    const blockWidthPt = sumColumnWidthPt(
      template,
      block.contentColumns.first,
      block.contentColumns.last,
    );
    const placement = placeBlockContent(
      blockEntries,
      block,
      blockWidthPt,
      options.rendererMap,
    );

    cells.push(...placement.cells);
    merges.push(...placement.merges);

    const budget = computeBlockBudget(template, block);
    const warning = computeOverflowWarning(block, budget, placement);
    if (warning) {
      overflowWarnings.push(warning);
      for (const id of warning.droppedEntryIds) {
        droppedEntryIds.add(id);
      }
    }
  }

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

  const appendices = buildAppendixSheets(allEntries, droppedEntryIds, options.rendererMap);

  return {
    templateId: template.id,
    language: template.language,
    styles: template.styles,
    sheets: { a3: a3Sheet, appendices },
    overflowWarnings,
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
): readonly SheetDescriptor[] {
  const appendixEntries = all.filter(
    ({ entry }) => entry.a3Visibility === "appendix" || droppedEntryIds.has(entry.id),
  );

  return appendixEntries.map(({ entry }, index) => {
    const renderer = rendererMap[entry.methodId];
    const content = renderer
      ? renderer(entry.payload, { id: entry.id, title: entry.title })
      : { lines: [{ text: entry.title, bold: true }] };

    const cells: CellData[] = [
      { ref: "B2", value: entry.title, styleId: "entryContentBold" },
      ...content.lines.map((line, lineIndex) => ({
        ref: `B${4 + lineIndex}`,
        value: line.text,
        styleId: line.bold ? "entryContentBold" : "entryContent",
      })),
    ];

    return {
      name: `Appendix A${index + 1}`,
      columns: [{ key: "A", charWidth: 2 }, { key: "B", charWidth: 80 }],
      rows: [
        { index: 2, heightPt: 24 },
        ...content.lines.map((_, lineIndex) => ({ index: 4 + lineIndex, heightPt: 20 })),
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

function topLeft(range: string): string {
  return range.split(":")[0] ?? range;
}

function sumColumnWidthPt(template: A3Template, firstKey: string, lastKey: string): number {
  const firstIndex = template.columns.findIndex((column) => column.key === firstKey);
  const lastIndex = template.columns.findIndex((column) => column.key === lastKey);
  return template.columns
    .slice(firstIndex, lastIndex + 1)
    .reduce((total, column) => total + excelColumnWidthToPt(column.charWidth), 0);
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
