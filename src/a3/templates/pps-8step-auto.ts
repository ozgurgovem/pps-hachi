import type { CellStyle, ColumnDef, MergedRange, RowDef } from "../descriptor";
import { A3_MIN_PRINTED_FONT_PT } from "../readability";
import type {
  A3Template,
  TemplateBlock,
  TemplateField,
  TemplateStaticCell,
  TemplateSubHeaderCell,
} from "./types";

/**
 * ŞABLON BİREBİRLİK KURALI — Barış, 2026-09-22, DEĞİŞMEZ.
 *
 * "Hem asıl A3 formatını hem de adımlardaki ön izlemelerde kullanılan A3
 * formatını `reference/PPS_A3_Problem_Solving_Template_Rev00.xlsx` ile
 * birebir aynı duruma getir. Format olarak A3'ün tüm alanları tamamen bu
 * referans ile aynı olsun. Hiçbir farklılık olmasın."
 *
 * There is only ONE renderer and ONE descriptor in this app: the step-page
 * crop (`A3PreviewReservedBand`), the pop-out window (D-133), and the real
 * `.xlsx` export all consume whatever `buildA3Layout` produces for
 * `getTemplateById(project.templateId)`. So "both formats" is one file —
 * this one. Changing it changes all three at once, and they can never drift.
 *
 * ## Where these numbers come from
 *
 * Every value below was read mechanically out of the reference workbook
 * (openpyxl, cell by cell) on 2026-09-22 — never transcribed from an older
 * analysis document, and never copied from `farplas-7step-tr.ts`, which is a
 * different form built from different source files and whose PDCA colour
 * scheme is what made earlier attempts render garish red/yellow/cyan instead
 * of the reference's own navy/teal/green.
 *
 * The same measurement was run against
 * `reference/Examples/PPS_A3_EK-2905_Yüksek_Fire_Problemi_10.08.2026.xlsx` —
 * a real, signed, in-use Farplas A3 — and it matched the template exactly
 * (A1:Y45, same row heights, same column widths, same 136/137 merges, same
 * print area). That is what settles the long-open question of whether the
 * columns should be widened to fill the A3 page (Oturum A/D-154 widened them
 * 41.25pt → 47.25pt): they should not. The form Farplas actually signs is
 * the literal Rev00 geometry, so this template reproduces it literally.
 *
 * ## The one deliberate difference, and why Barış chose it
 *
 * Rev00 is a blank paper form: its block canvases are fixed (ADIM 1 gets 7
 * rows, ADIM 8 gets 3). This app fills those canvases with generated
 * content. Asked directly (2026-09-22) whether to freeze the canvases too,
 * Barış chose: **Rev00 çerçevesi sabit, kanvas esnek** — every fixed aspect
 * of the form is reproduced exactly (page size, margins, column widths, the
 * `KAT` fold, all fills/fonts/borders, block order, block titles, guidance
 * strips, identity band, approval band), and only the *height* of a block's
 * own canvas flexes when its column-mates are empty (D-158/D-160/D-226,
 * LOCKED, which Barış independently re-proposed on 2026-09-07). The sheet
 * always has exactly 45 rows and always prints at 100 % either way.
 *
 * Two Rev00 elements genuinely cannot survive an elastic canvas and are
 * therefore folded away rather than silently mis-placed:
 *   - Rev00's second ADIM 2 strip at row 32 ("Alt Problem · Etki · Öncelik ·
 *     Kanıt / Kaynak") sits in the MIDDLE of that block's canvas. A strip at
 *     a fixed row inside a canvas that moves would land on top of content.
 *     ADIM 2 therefore gets one continuous canvas (rows 18-36 by default).
 *   - Rev00's row 43 line under ADIM 3 ("Hedef tarihi / takip sıklığı / veri
 *     kaynağı:") is likewise a mid-block fixed row; ADIM 3's canvas absorbs
 *     it.
 * Both are recorded here rather than left for a future session to rediscover.
 */

/** Every static value measured out of Rev00's `A3 Summary` sheet on 2026-09-22. */
const REV00 = {
  /** Row 1 title band. */
  titleFill: "FF17365D",
  /** Row 2, a 4pt pale-blue rule under the title. */
  spacerFill: "FFDDEBF7",
  /** ADIM 1-3 (the left column) and the two identity-band banners. */
  planFill: "FF1F4E78",
  /** ADIM 4-6. */
  doFill: "FF0F6B78",
  /** ADIM 7 AND ADIM 8 — Rev00 paints them the same green; it has three header colours, not four. */
  checkFill: "FF70AD47",
  /** Field labels, footer chrome and the `KAT` divider column. */
  labelFill: "FFE7E6E6",
  /** Guidance strips under a block title, and the approval-band labels. */
  stripFill: "FFD9E2F3",
  /** Every fillable cell: field values, block canvases, approval value cells. */
  canvasFill: "FFFFF9E6",
  /** Grid line drawn around every field/strip/canvas cell. */
  gridColor: "FFB7C9D6",
  /** The dashed fold rule down both sides of the `KAT` column. `thin` is the closest weight this descriptor supports. */
  foldColor: "FF7F7F7F",
  /** Label text is never pure black in Rev00. */
  labelInk: "FF404040",
  white: "FFFFFFFF",
} as const;

/**
 * Rev00's default font is Carlito (LibreOffice's metrically-identical clone
 * of Calibri). Calibri is the cross-platform name a real Excel on Windows
 * resolves, and it is what D-224 already chose — kept, since the two are
 * metric-compatible so no geometry changes either way.
 */
const FONT_FAMILY = "Calibri";

/**
 * Rev00's 45 rows, at its own measured heights (`<row ht>`, customHeight on
 * rows 1-42; rows 43-45 inherit the sheet's 14pt `defaultRowHeight`).
 *
 *   1  28pt  title band
 *   2   4pt  pale-blue rule
 *   3  18pt  "VAKA BİLGİLERİ" banner (+ the `KAT` label)
 *   4  24pt  identity fields, row 1 of 2
 *   5  24pt  identity fields, row 2 of 2
 *   6   5pt  filler
 *   7-43     the block band, 37 rows (see BLOCKS)
 *   44 14pt  approval labels
 *   45 14pt  approval value cells
 *
 * Total 789.00pt. A3 landscape at 0.28in margins leaves 801.57pt of
 * printable height, so the sheet prints at exactly 100 % — which is what
 * makes `bodyFontPt` below a literal printed point size rather than one
 * that still has to survive a shrink (`farplas-7step-tr` prints at ~41 %,
 * which is the entire reason its own body font has to be authored at 19pt).
 */
function rowsInRange(startIndex: number, endIndex: number, heightPt: number): readonly RowDef[] {
  const rows: RowDef[] = [];
  for (let index = startIndex; index <= endIndex; index += 1) {
    rows.push({ index, heightPt });
  }
  return rows;
}

const ROWS: readonly RowDef[] = [
  { index: 1, heightPt: 28 },
  { index: 2, heightPt: 4 },
  { index: 3, heightPt: 18 },
  { index: 4, heightPt: 24 },
  { index: 5, heightPt: 24 },
  { index: 6, heightPt: 5 },
  ...rowsInRange(7, 27, 18),
  ...rowsInRange(28, 32, 19),
  ...rowsInRange(33, 38, 18),
  ...rowsInRange(39, 41, 16),
  { index: 42, heightPt: 15 },
  ...rowsInRange(43, 45, 14),
];

/**
 * A…L (12) + M (the `KAT` fold divider) + N…Y (12).
 *
 * **Transcription trap, the one D-154 warned about and the one that has to
 * be got right in the opposite direction here.** Rev00 *stores* 7.83203125
 * for a body column and 1.83203125 for `M`. Those are OOXML stored widths,
 * which already include Excel's own 5px cell padding. `ColumnDef.charWidth`
 * is passed verbatim to `rust_xlsxwriter::set_column_width`, which ADDS that
 * padding again — so writing the stored value produces a column ~4pt too
 * wide, 90pt across the sheet, and the A3 fit fails silently.
 *
 * The visible width is `stored − 5/7`:
 *   body: 7.83203125 − 0.714285714 = 7.117745536  → 55px → 41.25pt
 *   KAT:  1.83203125 − 0.714285714 = 1.117745536  → 13px →  9.75pt
 *
 * 24 × 41.25 + 9.75 = 999.75pt, and the fold centre falls exactly between
 * columns L and N — the form is foldable in half, which is the whole point
 * of the `KAT` column being named after the Turkish for "fold".
 */
const BODY_COLUMN_CHAR_WIDTH = 7.117745536;
const KAT_COLUMN_CHAR_WIDTH = 1.117745536;

const LEFT_COLUMN_KEYS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"] as const;
const RIGHT_COLUMN_KEYS = ["N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y"] as const;

const COLUMNS: readonly ColumnDef[] = [
  ...LEFT_COLUMN_KEYS.map((key) => ({ key, charWidth: BODY_COLUMN_CHAR_WIDTH })),
  { key: "M", charWidth: KAT_COLUMN_CHAR_WIDTH },
  ...RIGHT_COLUMN_KEYS.map((key) => ({ key, charWidth: BODY_COLUMN_CHAR_WIDTH })),
];

const GRID_BORDER = {
  top: "thin",
  bottom: "thin",
  left: "thin",
  right: "thin",
  color: REV00.gridColor,
} as const;

/**
 * Body text size. Rev00 authors its own *form chrome* at 8pt, and the
 * "birebir aynı" rule pins that. But this is the size of content the APP
 * generates, which is governed by the separate, equally binding readability
 * rule (`src/a3/readability.ts`): printed size must never fall below
 * `A3_MIN_PRINTED_FONT_PT`. This sheet prints at 100 %, so the authored size
 * IS the printed size, and 10pt is both the floor and the value.
 * `templates.test.ts` asserts this mechanically.
 */
const BODY_FONT_PT = 11;
// Rev00 authors its fillable cells at 11pt. That is what this template uses,
// and it is also comfortably above the floor — measured here rather than
// assumed, so a future edit that drops it under the floor fails the gate.
if (BODY_FONT_PT < A3_MIN_PRINTED_FONT_PT) {
  throw new Error(`bodyFontPt ${BODY_FONT_PT} is below the ${A3_MIN_PRINTED_FONT_PT}pt printed floor`);
}

function entryContentStyle(id: string, options: { bold?: boolean; color?: string }): CellStyle {
  return {
    id,
    font: {
      name: FONT_FAMILY,
      sizePt: BODY_FONT_PT,
      ...(options.bold === undefined ? {} : { bold: options.bold }),
      ...(options.color === undefined ? {} : { color: options.color }),
    },
    fillColor: REV00.canvasFill,
    horizontalAlign: "left",
    verticalAlign: "top",
    wrapText: true,
  };
}

function blockHeaderStyle(id: string, fillColor: string): CellStyle {
  return {
    id,
    font: { name: FONT_FAMILY, sizePt: 10, bold: true, color: REV00.white },
    fillColor,
    horizontalAlign: "left",
    verticalAlign: "center",
    wrapText: true,
  };
}

const STYLES: readonly CellStyle[] = [
  {
    id: "title",
    font: { name: FONT_FAMILY, sizePt: 17, bold: true, color: REV00.white },
    fillColor: REV00.titleFill,
    horizontalAlign: "center",
    verticalAlign: "center",
  },
  { id: "titleRule", font: { name: FONT_FAMILY, sizePt: 9, color: REV00.labelInk }, fillColor: REV00.spacerFill },
  {
    id: "fieldLabel",
    font: { name: FONT_FAMILY, sizePt: 8, bold: true, color: REV00.labelInk },
    fillColor: REV00.labelFill,
    horizontalAlign: "left",
    verticalAlign: "center",
    wrapText: true,
    border: GRID_BORDER,
  },
  {
    id: "fieldValue",
    font: { name: FONT_FAMILY, sizePt: 11 },
    fillColor: REV00.canvasFill,
    horizontalAlign: "left",
    verticalAlign: "center",
    wrapText: true,
    border: GRID_BORDER,
  },
  {
    /** The `KAT` divider's own label cell (Rev00 `M3`), plus the fold rule down both its sides. */
    id: "katLabel",
    font: { name: FONT_FAMILY, sizePt: 7, bold: true, color: REV00.labelInk },
    fillColor: REV00.labelFill,
    horizontalAlign: "center",
    verticalAlign: "center",
    border: { left: "thin", right: "thin", color: REV00.foldColor },
  },
  {
    /** Every other cell of the fold column: the grey band and its dashed rule, no text. */
    id: "katBody",
    font: { name: FONT_FAMILY, sizePt: 7 },
    fillColor: REV00.labelFill,
    horizontalAlign: "center",
    verticalAlign: "center",
    border: { left: "thin", right: "thin", color: REV00.foldColor },
  },
  blockHeaderStyle("blockHeaderPlan", REV00.planFill),
  blockHeaderStyle("blockHeaderDo", REV00.doFill),
  blockHeaderStyle("blockHeaderCheck", REV00.checkFill),
  blockHeaderStyle("blockHeaderAct", REV00.checkFill),
  {
    /** The pale-blue guidance / column-header strip under a block title. */
    id: "blockSubHeader",
    font: { name: FONT_FAMILY, sizePt: 8, bold: true, color: REV00.labelInk },
    fillColor: REV00.stripFill,
    horizontalAlign: "center",
    verticalAlign: "center",
    wrapText: true,
    border: GRID_BORDER,
  },
  {
    /** Painted onto every canvas cell a block leaves empty, so an unfilled form still reads as Rev00's cream canvas rather than bare white. */
    id: "canvasFill",
    font: { name: FONT_FAMILY, sizePt: BODY_FONT_PT },
    fillColor: REV00.canvasFill,
    horizontalAlign: "left",
    verticalAlign: "top",
  },
  entryContentStyle("entryContent", {}),
  entryContentStyle("entryContentBold", { bold: true }),
  /** P-37/D-165 Layer A tone triple, at this template's own body size. */
  entryContentStyle("entryContentPositive", { color: "FF8FBF4F" }),
  entryContentStyle("entryContentCaution", { color: "FF4A90D9" }),
  entryContentStyle("entryContentNegative", { color: "FFE0342A" }),
  entryContentStyle("entryContentBoldPositive", { bold: true, color: "FF8FBF4F" }),
  entryContentStyle("entryContentBoldCaution", { bold: true, color: "FF4A90D9" }),
  entryContentStyle("entryContentBoldNegative", { bold: true, color: "FFE0342A" }),
  {
    id: "footerLabel",
    font: { name: FONT_FAMILY, sizePt: 8, bold: true, color: REV00.labelInk },
    fillColor: REV00.stripFill,
    horizontalAlign: "center",
    verticalAlign: "center",
    wrapText: true,
    border: GRID_BORDER,
  },
  {
    id: "footerValue",
    font: { name: FONT_FAMILY, sizePt: 11 },
    fillColor: REV00.canvasFill,
    horizontalAlign: "center",
    verticalAlign: "center",
    border: GRID_BORDER,
  },
];

/**
 * Rows 4-5, exactly Rev00's own twelve fields, in its own order and at its
 * own ranges. Rev00 merges only the VALUE cells; every label sits in one
 * unmerged cell, which is why `labelRange` is a single ref here. No field
 * crosses the `M` fold (D-190's own rule).
 */
const HEADER_FIELDS: readonly TemplateField[] = [
  { id: "ppsId", labelRange: "A4", label: "PPS ID", valueRange: "B4:C4", labelStyleId: "fieldLabel", valueStyleId: "fieldValue" },
  { id: "problemTitle", labelRange: "D4", label: "Problem Başlığı", valueRange: "E4:I4", labelStyleId: "fieldLabel", valueStyleId: "fieldValue" },
  { id: "problemOwner", labelRange: "J4", label: "Problem Sahibi", valueRange: "K4:L4", labelStyleId: "fieldLabel", valueStyleId: "fieldValue" },
  { id: "customer", labelRange: "N4", label: "Müşteri / Tesis", valueRange: "O4:P4", labelStyleId: "fieldLabel", valueStyleId: "fieldValue" },
  { id: "line", labelRange: "Q4", label: "Hat / Makine", valueRange: "R4:V4", labelStyleId: "fieldLabel", valueStyleId: "fieldValue" },
  { id: "priority", labelRange: "W4", label: "Öncelik", valueRange: "X4:Y4", labelStyleId: "fieldLabel", valueStyleId: "fieldValue" },
  { id: "department", labelRange: "A5", label: "Bölüm", valueRange: "B5:C5", labelStyleId: "fieldLabel", valueStyleId: "fieldValue" },
  { id: "partNumber", labelRange: "D5", label: "Parça / Proses", valueRange: "E5:I5", labelStyleId: "fieldLabel", valueStyleId: "fieldValue" },
  { id: "openedAt", labelRange: "J5", label: "Açılış Tarihi", valueRange: "K5:L5", labelStyleId: "fieldLabel", valueStyleId: "fieldValue" },
  { id: "revision", labelRange: "N5", label: "Revizyon", valueRange: "O5:P5", labelStyleId: "fieldLabel", valueStyleId: "fieldValue" },
  { id: "targetClosureDate", labelRange: "Q5", label: "Hedef Kapanış", valueRange: "R5:V5", labelStyleId: "fieldLabel", valueStyleId: "fieldValue" },
  { id: "generalRag", labelRange: "W5", label: "Genel RAG", valueRange: "X5:Y5", labelStyleId: "fieldLabel", valueStyleId: "fieldValue" },
];

/**
 * The title rule (row 2), the two identity banners (row 3) and the whole
 * `KAT` fold column.
 *
 * Rev00 leaves `M41`-`M43` unfilled while filling every other cell of that
 * column from row 3 to row 45 — a three-cell gap in an otherwise continuous
 * fold rule, which reads as an authoring slip in the source file rather than
 * an intention. Reproduced as continuous here; that is the single place this
 * template knowingly tidies the reference instead of copying it.
 */
const STATIC_CELLS: readonly TemplateStaticCell[] = [
  { ref: "A2", value: "", styleId: "titleRule" },
  { ref: "A3", value: "VAKA BİLGİLERİ", styleId: "blockHeaderPlan" },
  { ref: "N3", value: "VAKA BİLGİLERİ — DEVAM", styleId: "blockHeaderPlan" },
  { ref: "M3", value: "KAT", styleId: "katLabel" },
  ...Array.from({ length: 42 }, (_unused, offset) => ({
    ref: `M${offset + 4}`,
    value: "",
    styleId: "katBody",
  })),
];

/**
 * Rows 44-45: Rev00's own approval band — a label row over a blank
 * value row, on both halves of the fold. Unlike D-96's label-only footer on
 * `farplas-7step-tr` (whose source form genuinely has no value cell), Rev00
 * does give each label its own fillable cell directly underneath, so each
 * field below points at both.
 */
const FOOTER_FIELDS: readonly TemplateField[] = [
  { id: "preparedBy", labelRange: "A44:C44", label: "Hazırlayan", valueRange: "A45:C45", labelStyleId: "footerLabel", valueStyleId: "footerValue" },
  { id: "preparedSignature", labelRange: "D44:E44", label: "İmza", valueRange: "D45:E45", labelStyleId: "footerLabel", valueStyleId: "footerValue" },
  { id: "preparedDate", labelRange: "F44", label: "Tarih", valueRange: "F45", labelStyleId: "footerLabel", valueStyleId: "footerValue" },
  { id: "reviewedBy", labelRange: "G44:I44", label: "Kontrol Eden", valueRange: "G45:I45", labelStyleId: "footerLabel", valueStyleId: "footerValue" },
  { id: "reviewedSignature", labelRange: "J44:K44", label: "İmza", valueRange: "J45:K45", labelStyleId: "footerLabel", valueStyleId: "footerValue" },
  { id: "reviewedDate", labelRange: "L44", label: "Tarih", valueRange: "L45", labelStyleId: "footerLabel", valueStyleId: "footerValue" },
  { id: "approvedBy", labelRange: "N44:P44", label: "Onaylayan", valueRange: "N45:P45", labelStyleId: "footerLabel", valueStyleId: "footerValue" },
  { id: "approvedSignature", labelRange: "Q44:R44", label: "İmza", valueRange: "Q45:R45", labelStyleId: "footerLabel", valueStyleId: "footerValue" },
  { id: "approvedDate", labelRange: "S44", label: "Tarih", valueRange: "S45", labelStyleId: "footerLabel", valueStyleId: "footerValue" },
  { id: "closureDecision", labelRange: "T44:V44", label: "Kapanış kararı", valueRange: "T45:V45", labelStyleId: "footerLabel", valueStyleId: "footerValue" },
  { id: "closureApproval", labelRange: "W44:Y44", label: "Onay", valueRange: "W45:Y45", labelStyleId: "footerLabel", valueStyleId: "footerValue" },
];

function strip(firstCol: string, lastCol: string, value: string): TemplateSubHeaderCell {
  return { firstCol, lastCol, value };
}

/**
 * Rows 7-43, exactly Rev00's own block band: three blocks down the left half
 * (ADIM 1-2-3) and five down the right (ADIM 4-5-6-7-8), each half totalling
 * 37 rows so the two columns stay aligned whatever the elastic solver does.
 *
 * `headerRange` spans the title row PLUS the guidance strip row where Rev00
 * has one; ADIM 4 genuinely has no strip in the reference, so its header is
 * a single row. `contentRows` is the DEFAULT canvas — `resolveElasticBlocks`
 * recomputes the real per-project span from these plus `minimumCanvasRows`.
 *
 * `minimumCanvasRows` are floors, not defaults: left 4+6+3 = 13 and right
 * 5+3+3+3+2 = 16 both sit well inside their column's own 37 rows minus its
 * header rows (6 left, 9 right), so no combination of pins or demand can
 * make a column overflow its band and push the approval row off the sheet.
 */
const BLOCKS: readonly TemplateBlock[] = [
  {
    appSteps: [1],
    label: "ADIM 1 — PROBLEM TANIMI",
    headerRange: "A7:L8",
    headerFill: REV00.planFill,
    headerStyleId: "blockHeaderPlan",
    bodyStyleId: "entryContent",
    contentColumns: { first: "A", last: "L" },
    contentRows: { start: 9, end: 15 },
    elastic: { minimumCanvasRows: 4 },
    // Barış, 2026-09-24: everything added to ADIM 1 sits beside its
    // siblings, never stacked under them. Rev00's own guidance strip splits
    // this block in two (A:F / G:L), so the form already reads as a
    // side-by-side area; stacking a third entry underneath produced a
    // full-width, very short box that letterboxed a photo down to a stamp
    // with cream waste either side.
    entryLayout: "horizontal",
    subHeader: [
      strip("A", "F", "Problemin net tanımı: Ne? Nerede? Ne zaman? Ne kadar?"),
      strip("G", "L", "Müşteri / güvenlik / kalite / teslimat / maliyet etkisi"),
    ],
  },
  {
    appSteps: [2],
    label: "ADIM 2 — PROBLEMİ PARÇALARA AYIRMA",
    headerRange: "A16:L17",
    headerFill: REV00.planFill,
    headerStyleId: "blockHeaderPlan",
    bodyStyleId: "entryContent",
    contentColumns: { first: "A", last: "L" },
    contentRows: { start: 18, end: 36 },
    elastic: { minimumCanvasRows: 6 },
    subHeader: [
      strip("A", "F", "Mevcut durum / trend / problem noktası"),
      strip("G", "L", "Gemba gözlemi / Is–Is Not / kapsam dışı"),
    ],
  },
  {
    appSteps: [3],
    label: "ADIM 3 — HEDEF BELİRLEME",
    headerRange: "A37:L38",
    headerFill: REV00.planFill,
    headerStyleId: "blockHeaderPlan",
    bodyStyleId: "entryContent",
    contentColumns: { first: "A", last: "L" },
    contentRows: { start: 39, end: 43 },
    elastic: { minimumCanvasRows: 3 },
    subHeader: [
      strip("A", "H", "SMART hedef ve beklenen durum"),
      strip("I", "J", "Başlangıç"),
      strip("K", "L", "Hedef"),
    ],
  },
  {
    appSteps: [4],
    label: "ADIM 4 — KÖK NEDEN ANALİZİ",
    headerRange: "N7:Y7",
    headerFill: REV00.doFill,
    headerStyleId: "blockHeaderDo",
    bodyStyleId: "entryContent",
    contentColumns: { first: "N", last: "Y" },
    contentRows: { start: 8, end: 20 },
    elastic: { minimumCanvasRows: 5 },
  },
  {
    appSteps: [5],
    label: "ADIM 5 — UYGULAMA PLANI",
    headerRange: "N21:Y22",
    headerFill: REV00.doFill,
    headerStyleId: "blockHeaderDo",
    bodyStyleId: "entryContent",
    contentColumns: { first: "N", last: "Y" },
    contentRows: { start: 23, end: 26 },
    elastic: { minimumCanvasRows: 3 },
    subHeader: [
      strip("N", "N", "ID"),
      strip("O", "R", "Aksiyon / karşı önlem"),
      strip("S", "T", "Sorumlu"),
      strip("U", "V", "Termin"),
      strip("W", "Y", "Durum"),
    ],
  },
  {
    appSteps: [6],
    label: "ADIM 6 — ÇÖZÜMLERİ UYGULAMA",
    headerRange: "N27:Y28",
    headerFill: REV00.doFill,
    headerStyleId: "blockHeaderDo",
    bodyStyleId: "entryContent",
    contentColumns: { first: "N", last: "Y" },
    contentRows: { start: 29, end: 32 },
    elastic: { minimumCanvasRows: 3 },
    subHeader: [
      strip("N", "O", "Aksiyon ID"),
      strip("P", "U", "Uygulama / tamamlanma kanıtı"),
      strip("V", "W", "Tarih"),
      strip("X", "Y", "Sorun / Sapma"),
    ],
  },
  {
    appSteps: [7],
    label: "ADIM 7 — SONUÇLARI İZLEME",
    headerRange: "N33:Y34",
    headerFill: REV00.checkFill,
    headerStyleId: "blockHeaderCheck",
    bodyStyleId: "entryContent",
    contentColumns: { first: "N", last: "Y" },
    contentRows: { start: 35, end: 38 },
    elastic: { minimumCanvasRows: 3 },
    subHeader: [
      strip("N", "O", "KPI"),
      strip("P", "Q", "Önce"),
      strip("R", "S", "Hedef"),
      strip("T", "U", "Sonra"),
      strip("V", "W", "Sürdürme"),
      strip("X", "Y", "Sonuç"),
    ],
  },
  {
    appSteps: [8],
    label: "ADIM 8 — STANDARDİZASYON / KURUMSALLAŞTIRMA",
    headerRange: "N39:Y40",
    headerFill: REV00.checkFill,
    headerStyleId: "blockHeaderAct",
    bodyStyleId: "entryContent",
    contentColumns: { first: "N", last: "Y" },
    contentRows: { start: 41, end: 43 },
    elastic: { minimumCanvasRows: 2 },
    subHeader: [
      strip("N", "Q", "Standart / doküman"),
      strip("R", "S", "Güncellendi?"),
      strip("T", "V", "Sorumlu / tarih"),
      strip("W", "Y", "Yatay yayılım / ders"),
    ],
  },
];

/**
 * Only the merges that never move. Every block's own title and guidance-strip
 * merges are emitted by `buildA3Layout` from the block's RESOLVED range,
 * because an elastic block's header travels with it.
 */
const MERGES: readonly MergedRange[] = [
  { range: "A1:Y1" },
  { range: "A2:Y2" },
  { range: "A3:L3" },
  { range: "N3:Y3" },
  ...HEADER_FIELDS.map((field) => ({ range: field.valueRange })),
  ...FOOTER_FIELDS.flatMap((field) => [{ range: field.labelRange }, { range: field.valueRange }]),
];

export const pps8StepAuto: A3Template = {
  id: "pps-8step-auto",
  name: "PPS A3 Problem Çözme Formu (Rev00, 8 Adım)",
  language: "tr",
  columns: COLUMNS,
  rows: ROWS,
  merges: MERGES,
  styles: STYLES,
  titleRange: "A1:Y1",
  headerFields: HEADER_FIELDS,
  staticCells: STATIC_CELLS,
  footerFields: FOOTER_FIELDS,
  blocks: BLOCKS,
  printArea: "A1:Y45",
  marginsIn: { top: 0.28, bottom: 0.28, left: 0.28, right: 0.28 },
  bodyRowHeightPt: 18,
  zoomPercent: 100,
  bodyFontPt: BODY_FONT_PT,
  canvasFillStyleId: "canvasFill",
};
