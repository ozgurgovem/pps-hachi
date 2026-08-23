import { useMemo, type CSSProperties } from "react";
import { columnLetterToIndex, parseRange } from "../cellRef";
import type {
  A3LayoutDescriptor,
  CellData,
  CellStyle,
  ColumnDef,
  SheetDescriptor,
} from "../descriptor";
import { excelColumnWidthToPt, fitScale } from "../layout/measure";

/**
 * D-34: two modes. `screen` renders 1 pt = 1 px at 100 % zoom — legible but
 * not representative of the printed page. `print` applies the sheet's own
 * fit-to-page scale (~41.5 % for `farplas-7step-tr`), which is what makes a
 * D-40 legibility-floor violation visible instead of hidden behind a
 * comfortable on-screen size.
 *
 * This component maps an already-built `A3LayoutDescriptor` onto CSS Grid.
 * It must never compute layout, budget, placement, or overflow decisions
 * itself (D-94) — every pixel here traces back to a field already present
 * on the descriptor.
 */
export interface HtmlA3RendererProps {
  readonly descriptor: A3LayoutDescriptor;
  readonly mode: "screen" | "print";
}

const PT_TO_PX = 96 / 72;

/**
 * G3/D-198: "provisional" block marker — Aday A of the Block Visual
 * Verification Loop, approved by Barış with no changes. Deliberately just a
 * dashed line, no fill, no label: the app's own `--graphite` ink (D-49),
 * reused here as the literal sheet ARGB `FF20241F` so screen and print stay
 * WYSIWYG (D-03) — zero overlap with D-165's 9 semantic colors or D-47's 4
 * PDCA header fills, verified against `TEMPLATE_ANALYSIS.md` §14.1's hex
 * table before picking it.
 */
const PROVISIONAL_BORDER_PT = 2;
const PROVISIONAL_BORDER_COLOR = "#20241F";

interface MergeSpan {
  readonly colSpan: number;
  readonly rowSpan: number;
}

function buildMergeIndex(sheet: SheetDescriptor): {
  readonly spanByTopLeft: ReadonlyMap<string, MergeSpan>;
  readonly covered: ReadonlySet<string>;
} {
  const spanByTopLeft = new Map<string, MergeSpan>();
  const covered = new Set<string>();

  for (const merge of sheet.merges) {
    const { start, end } = parseRange(merge.range);
    const colSpan = columnLetterToIndex(end.column) - columnLetterToIndex(start.column) + 1;
    const rowSpan = end.row - start.row + 1;
    const topLeftRef = `${start.column}${start.row}`;
    spanByTopLeft.set(topLeftRef, { colSpan, rowSpan });

    for (let col = columnLetterToIndex(start.column); col <= columnLetterToIndex(end.column); col += 1) {
      for (let row = start.row; row <= end.row; row += 1) {
        const ref = `${columnIndexToLetter(col)}${row}`;
        if (ref !== topLeftRef) {
          covered.add(ref);
        }
      }
    }
  }

  return { spanByTopLeft, covered };
}

function columnIndexToLetter(index: number): string {
  let n = index + 1;
  let letters = "";
  while (n > 0) {
    const remainder = (n - 1) % 26;
    letters = String.fromCharCode(65 + remainder) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
}

function cellStyleToCss(style: CellStyle | undefined, scale: number): CSSProperties {
  if (!style) {
    return {};
  }
  const css: CSSProperties = {
    fontFamily: style.font.name,
    fontSize: `${style.font.sizePt * scale}pt`,
    fontWeight: style.font.bold ? 700 : 400,
    fontStyle: style.font.italic ? "italic" : "normal",
    color: style.font.color ? argbToCss(style.font.color) : undefined,
    backgroundColor: style.fillColor ? argbToCss(style.fillColor) : undefined,
    textAlign: style.horizontalAlign,
    whiteSpace: style.wrapText ? "pre-wrap" : "nowrap",
    overflow: "hidden",
    display: "flex",
    alignItems:
      style.verticalAlign === "top"
        ? "flex-start"
        : style.verticalAlign === "bottom"
          ? "flex-end"
          : "center",
    justifyContent:
      style.horizontalAlign === "right"
        ? "flex-end"
        : style.horizontalAlign === "center"
          ? "center"
          : "flex-start",
    padding: "1px 2px",
    boxSizing: "border-box",
  };
  return css;
}

function argbToCss(argb: string): string {
  // "FFRRGGBB" -> "#RRGGBB" (alpha channel is always opaque for this sheet's fills/fonts).
  return `#${argb.slice(2)}`;
}

export function HtmlA3Renderer({ descriptor, mode }: HtmlA3RendererProps) {
  const sheet = descriptor.sheets.a3;
  const scale = mode === "print" ? fitScale(sheet.rows, sheet.pageSetup.marginsIn) : 1;

  const stylesById = useMemo(() => {
    const map = new Map<string, CellStyle>();
    for (const style of descriptor.styles) {
      map.set(style.id, style);
    }
    return map;
  }, [descriptor.styles]);

  const { spanByTopLeft, covered } = useMemo(() => buildMergeIndex(sheet), [sheet]);

  const gridTemplateColumns = sheet.columns
    .map((column: ColumnDef) => `${excelColumnWidthToPt(column.charWidth) * PT_TO_PX * scale}px`)
    .join(" ");
  const gridTemplateRows = sheet.rows.map((row) => `${row.heightPt * PT_TO_PX * scale}px`).join(" ");

  const columnIndexByKey = useMemo(() => {
    const map = new Map<string, number>();
    sheet.columns.forEach((column, index) => map.set(column.key, index));
    return map;
  }, [sheet.columns]);

  const rowIndexByNumber = useMemo(() => {
    const map = new Map<number, number>();
    sheet.rows.forEach((row, index) => map.set(row.index, index));
    return map;
  }, [sheet.rows]);

  const renderableCells: CellData[] = sheet.cells.filter((cell) => !covered.has(cell.ref));

  return (
    <div
      role="img"
      aria-label={`${descriptor.templateId} A3 ${mode === "print" ? "print preview" : "preview"}`}
      style={{
        position: "relative",
        display: "grid",
        gridTemplateColumns,
        gridTemplateRows,
        background: "#ffffff",
        // A3 sheet is white paper / black ink by convention, never the
        // app's own theme — `background` was already hardcoded this way,
        // `color` was not, so any style with no explicit `font.color`
        // (`entryContent`, `bodyCell`, `title`, `fieldLabel`, … 11 of the
        // template's 15 styles, see D-135) fell through to CSS inheritance
        // and picked up `--color-ink`, which is near-white in dark theme —
        // unreadable on this always-white background. An inline
        // `cellStyleToCss` color always wins over this regardless (the four
        // PDCA header styles set their own white/black explicitly), so this
        // only ever affects cells that had no color decided for them.
        color: "#000000",
      }}
    >
      {renderableCells.map((cell) => {
        const columnIndex = columnIndexByKey.get(cellColumnKey(cell.ref));
        const rowIndex = rowIndexByNumber.get(cellRowNumber(cell.ref));
        if (columnIndex === undefined || rowIndex === undefined) {
          return null;
        }
        const span = spanByTopLeft.get(cell.ref) ?? { colSpan: 1, rowSpan: 1 };
        return (
          <div
            key={cell.ref}
            style={{
              gridColumn: `${columnIndex + 1} / span ${span.colSpan}`,
              gridRow: `${rowIndex + 1} / span ${span.rowSpan}`,
              ...cellStyleToCss(stylesById.get(cell.styleId ?? ""), scale),
            }}
          >
            {cell.value}
          </div>
        );
      })}
      {sheet.images.map((image) => {
        const columnIndex = columnIndexByKey.get(cellColumnKey(image.anchorCell));
        const rowIndex = rowIndexByNumber.get(cellRowNumber(image.anchorCell));
        if (columnIndex === undefined || rowIndex === undefined) {
          return null;
        }
        return (
          <img
            key={image.id}
            src={`data:${image.mimeType};base64,${image.data}`}
            alt=""
            style={{
              gridColumn: `${columnIndex + 1}`,
              gridRow: `${rowIndex + 1}`,
              width: `${image.widthPt * PT_TO_PX * scale}px`,
              height: `${image.heightPt * PT_TO_PX * scale}px`,
              marginLeft: `${(image.offsetXPt ?? 0) * PT_TO_PX * scale}px`,
              marginTop: `${(image.offsetYPt ?? 0) * PT_TO_PX * scale}px`,
              objectFit: "contain",
              zIndex: 1,
            }}
          />
        );
      })}
      {descriptor.provisionalBlocks.map((marker) => {
        const { start, end } = parseRange(marker.range);
        const startColumnIndex = columnIndexByKey.get(start.column);
        const startRowIndex = rowIndexByNumber.get(start.row);
        const endColumnIndex = columnIndexByKey.get(end.column);
        const endRowIndex = rowIndexByNumber.get(end.row);
        if (
          startColumnIndex === undefined ||
          startRowIndex === undefined ||
          endColumnIndex === undefined ||
          endRowIndex === undefined
        ) {
          return null;
        }
        return (
          <div
            key={`provisional-${marker.stepIds.join("-")}`}
            aria-hidden="true"
            style={{
              gridColumn: `${startColumnIndex + 1} / span ${endColumnIndex - startColumnIndex + 1}`,
              gridRow: `${startRowIndex + 1} / span ${endRowIndex - startRowIndex + 1}`,
              border: `${PROVISIONAL_BORDER_PT * PT_TO_PX * scale}px dashed ${PROVISIONAL_BORDER_COLOR}`,
              pointerEvents: "none",
              zIndex: 2,
            }}
          />
        );
      })}
    </div>
  );
}

function cellColumnKey(ref: string): string {
  const match = /^([A-Z]+)\d+$/.exec(ref);
  return match ? (match[1] ?? "") : "";
}

function cellRowNumber(ref: string): number {
  const match = /^[A-Z]+(\d+)$/.exec(ref);
  return match ? Number(match[1] ?? Number.NaN) : Number.NaN;
}
