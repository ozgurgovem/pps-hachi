import type { CellStyle, ColumnDef, MergedRange, RowDef } from "../descriptor";
import type { A3Template, TemplateBlock, TemplateField } from "./types";

/**
 * Faz 11/L1 (D-223, D-157 LOCKED): geometry transcribed from
 * `reference/TEMPLATE_ANALYSIS.md` §12 (the page contract, Oturum A) and
 * §12.8 (the elastic model's own DEFAULT row counts, used here as fixed
 * `contentRows.start/end` — the real elastic solver is L3, deliberately not
 * built this dilim, D-223 madde 3). Source: `reference/
 * PPS_A3_Problem_Solving_Template_Rev00.xlsx`, D-150 LOCKED.
 *
 * D-224 (this dilim's own finding while building it): §12.4's own text
 * ("her blok bir kartuş satırı artı bir etiket satırı taşır") means each
 * block reserves *two* non-canvas rows, not one — `headerRange` here spans
 * both as a single 2-row-tall merge (26 pt), leaving exactly §12.8's own
 * canvas row counts (12/26/6 left, 18/6/6/6/4 right) for `contentRows`.
 * Verified arithmetic: 14+28+8 = 50 (left), 20+8+8+8+6 = 50 (right), and
 * each block's own (header 2 + canvas N) sums back to its D-158 default.
 *
 * D-154's own transcription trap applies here too: `charWidth` is the
 * *visible-character* unit (8.285714 / 1.142857), never the OOXML stored
 * value — see `farplas-7step-tr.ts`'s own comment for the full arithmetic.
 */

function rowsInRange(startIndex: number, endIndex: number, heightPt: number): RowDef[] {
  const rows: RowDef[] = [];
  for (let index = startIndex; index <= endIndex; index += 1) {
    rows.push({ index, heightPt });
  }
  return rows;
}

/** §12.3: title 32pt, identity band 71pt (2 rows of 35.5), block band 650pt (50 rows of 13), approval band 42pt. */
const ROWS: readonly RowDef[] = [
  { index: 1, heightPt: 32 },
  { index: 2, heightPt: 35.5 },
  { index: 3, heightPt: 35.5 },
  ...rowsInRange(4, 53, 13),
  { index: 54, heightPt: 42 },
];

/** §12.2: A…L (12) + M (`KAT` divider) + N…Y (12) — a clean 12/1/12 grid, no legacy gutter columns (D-189/D-190's "Kusur 2" cannot occur here). */
const BODY_COLUMN_KEYS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y"] as const;

const COLUMNS: readonly ColumnDef[] = [
  ...BODY_COLUMN_KEYS.slice(0, 12).map((key) => ({ key, charWidth: 8.285714 })),
  { key: "M", charWidth: 1.142857 },
  ...BODY_COLUMN_KEYS.slice(12).map((key) => ({ key, charWidth: 8.285714 })),
];

const FONT_FAMILY = "Calibri";
const WHITE = "FFFFFFFF";
const BLACK = "FF000000";

/** D-47 PDCA header colours — identical hex to `farplas-7step-tr.ts`, same Steps 1-4/5-6/7/8 phase mapping. */
const PLAN_FILL = "FFFF0000";
const DO_FILL = "FFFFFF00";
const CHECK_FILL = "FF00CCFF";
const ACT_FILL = "FF008000";

const STYLES: readonly CellStyle[] = [
  {
    id: "title",
    font: { name: FONT_FAMILY, sizePt: 18, bold: true },
    horizontalAlign: "center",
    verticalAlign: "center",
    border: { top: "medium", bottom: "medium", left: "medium", right: "medium" },
  },
  {
    id: "fieldLabel",
    font: { name: FONT_FAMILY, sizePt: 10, bold: true },
    fillColor: "FFD9D9D9",
    horizontalAlign: "left",
    verticalAlign: "center",
    wrapText: true,
  },
  {
    id: "fieldValue",
    font: { name: FONT_FAMILY, sizePt: 10 },
    horizontalAlign: "left",
    verticalAlign: "center",
    wrapText: true,
  },
  {
    id: "blockHeaderPlan",
    font: { name: FONT_FAMILY, sizePt: 12, bold: true, color: WHITE },
    fillColor: PLAN_FILL,
    horizontalAlign: "left",
    verticalAlign: "center",
    wrapText: true,
  },
  {
    id: "blockHeaderDo",
    font: { name: FONT_FAMILY, sizePt: 12, bold: true, color: BLACK },
    fillColor: DO_FILL,
    horizontalAlign: "left",
    verticalAlign: "center",
    wrapText: true,
  },
  {
    id: "blockHeaderCheck",
    font: { name: FONT_FAMILY, sizePt: 12, bold: true, color: BLACK },
    fillColor: CHECK_FILL,
    horizontalAlign: "left",
    verticalAlign: "center",
    wrapText: true,
  },
  {
    id: "blockHeaderAct",
    font: { name: FONT_FAMILY, sizePt: 12, bold: true, color: BLACK },
    fillColor: ACT_FILL,
    horizontalAlign: "left",
    verticalAlign: "center",
    wrapText: true,
  },
  /**
   * D-40/§12.4: this template's fit scale is ~100% (D-146's 1:1 authoring,
   * §12.3's own arithmetic), so 8pt is the literal printed size, not a
   * scaled-down screen size the way `farplas-7step-tr`'s 19pt is.
   */
  {
    id: "entryContent",
    font: { name: FONT_FAMILY, sizePt: 8 },
    horizontalAlign: "left",
    verticalAlign: "top",
    wrapText: true,
  },
  {
    id: "entryContentBold",
    font: { name: FONT_FAMILY, sizePt: 8, bold: true },
    horizontalAlign: "left",
    verticalAlign: "top",
    wrapText: true,
  },
  /** P-37: same tone triple as `farplas-7step-tr.ts`, same D-165 Layer A hex, this template's own 8pt body size. */
  {
    id: "entryContentPositive",
    font: { name: FONT_FAMILY, sizePt: 8, color: "FF8FBF4F" },
    horizontalAlign: "left",
    verticalAlign: "top",
    wrapText: true,
  },
  {
    id: "entryContentCaution",
    font: { name: FONT_FAMILY, sizePt: 8, color: "FF4A90D9" },
    horizontalAlign: "left",
    verticalAlign: "top",
    wrapText: true,
  },
  {
    id: "entryContentNegative",
    font: { name: FONT_FAMILY, sizePt: 8, color: "FFE0342A" },
    horizontalAlign: "left",
    verticalAlign: "top",
    wrapText: true,
  },
  {
    id: "entryContentBoldPositive",
    font: { name: FONT_FAMILY, sizePt: 8, bold: true, color: "FF8FBF4F" },
    horizontalAlign: "left",
    verticalAlign: "top",
    wrapText: true,
  },
  {
    id: "entryContentBoldCaution",
    font: { name: FONT_FAMILY, sizePt: 8, bold: true, color: "FF4A90D9" },
    horizontalAlign: "left",
    verticalAlign: "top",
    wrapText: true,
  },
  {
    id: "entryContentBoldNegative",
    font: { name: FONT_FAMILY, sizePt: 8, bold: true, color: "FFE0342A" },
    horizontalAlign: "left",
    verticalAlign: "top",
    wrapText: true,
  },
  /** D-224/§14.1: Layer A goal-state *fill* styles — light fills, black text (D-165 v2). */
  {
    id: "bandPositive",
    font: { name: FONT_FAMILY, sizePt: 8, color: BLACK },
    fillColor: "FF8FBF4F",
    horizontalAlign: "left",
    verticalAlign: "center",
    wrapText: true,
  },
  {
    id: "bandCaution",
    font: { name: FONT_FAMILY, sizePt: 8, color: BLACK },
    fillColor: "FF4A90D9",
    horizontalAlign: "left",
    verticalAlign: "center",
    wrapText: true,
  },
  {
    id: "bandNegative",
    font: { name: FONT_FAMILY, sizePt: 8, color: BLACK },
    fillColor: "FFE0342A",
    horizontalAlign: "left",
    verticalAlign: "center",
    wrapText: true,
  },
  /** D-224/§14.1: Layer B 5N1K category chip fills — six colours, white text. */
  {
    id: "fiveN1kNe",
    font: { name: FONT_FAMILY, sizePt: 8, color: WHITE },
    fillColor: "FFC68A2E",
    horizontalAlign: "left",
    verticalAlign: "center",
    wrapText: true,
  },
  {
    id: "fiveN1kNeden",
    font: { name: FONT_FAMILY, sizePt: 8, color: WHITE },
    fillColor: "FF5F4470",
    horizontalAlign: "left",
    verticalAlign: "center",
    wrapText: true,
  },
  {
    id: "fiveN1kNasil",
    font: { name: FONT_FAMILY, sizePt: 8, color: WHITE },
    fillColor: "FF2F7A6E",
    horizontalAlign: "left",
    verticalAlign: "center",
    wrapText: true,
  },
  {
    id: "fiveN1kKim",
    font: { name: FONT_FAMILY, sizePt: 8, color: WHITE },
    fillColor: "FF8B3A5C",
    horizontalAlign: "left",
    verticalAlign: "center",
    wrapText: true,
  },
  {
    id: "fiveN1kNeZaman",
    font: { name: FONT_FAMILY, sizePt: 8, color: WHITE },
    fillColor: "FF8A5A3B",
    horizontalAlign: "left",
    verticalAlign: "center",
    wrapText: true,
  },
  {
    id: "fiveN1kNerede",
    font: { name: FONT_FAMILY, sizePt: 8, color: WHITE },
    fillColor: "FF556677",
    horizontalAlign: "left",
    verticalAlign: "center",
    wrapText: true,
  },
  {
    id: "footerLabel",
    font: { name: FONT_FAMILY, sizePt: 9, bold: true },
    horizontalAlign: "center",
    verticalAlign: "center",
    wrapText: true,
    border: { top: "thin", bottom: "thin", left: "thin", right: "thin" },
  },
];

/**
 * §12.3/D-153: rows 2-3, 12 fields, 3 per half per row — none crosses the
 * `M` divider (D-190's own lesson about a zone/field straddling the fold).
 * Order follows D-153's own listing exactly.
 */
const HEADER_FIELDS: readonly TemplateField[] = [
  { id: "ppsId", labelRange: "A2:B2", label: "PPS ID", valueRange: "C2:D2", labelStyleId: "fieldLabel", valueStyleId: "fieldValue" },
  { id: "problemTitle", labelRange: "E2:F2", label: "Problem Başlığı", valueRange: "G2:H2", labelStyleId: "fieldLabel", valueStyleId: "fieldValue" },
  { id: "problemOwner", labelRange: "I2:J2", label: "Problem Sahibi", valueRange: "K2:L2", labelStyleId: "fieldLabel", valueStyleId: "fieldValue" },
  { id: "customer", labelRange: "N2:O2", label: "Müşteri/Tesis", valueRange: "P2:Q2", labelStyleId: "fieldLabel", valueStyleId: "fieldValue" },
  { id: "line", labelRange: "R2:S2", label: "Hat/Makine", valueRange: "T2:U2", labelStyleId: "fieldLabel", valueStyleId: "fieldValue" },
  { id: "priority", labelRange: "V2:W2", label: "Öncelik", valueRange: "X2:Y2", labelStyleId: "fieldLabel", valueStyleId: "fieldValue" },
  { id: "department", labelRange: "A3:B3", label: "Bölüm", valueRange: "C3:D3", labelStyleId: "fieldLabel", valueStyleId: "fieldValue" },
  { id: "partNumber", labelRange: "E3:F3", label: "Parça/Proses", valueRange: "G3:H3", labelStyleId: "fieldLabel", valueStyleId: "fieldValue" },
  { id: "openedAt", labelRange: "I3:J3", label: "Açılış Tarihi", valueRange: "K3:L3", labelStyleId: "fieldLabel", valueStyleId: "fieldValue" },
  { id: "revision", labelRange: "N3:O3", label: "Revizyon", valueRange: "P3:Q3", labelStyleId: "fieldLabel", valueStyleId: "fieldValue" },
  { id: "targetClosureDate", labelRange: "R3:S3", label: "Hedef Kapanış", valueRange: "T3:U3", labelStyleId: "fieldLabel", valueStyleId: "fieldValue" },
  { id: "generalRag", labelRange: "V3:W3", label: "Genel RAG", valueRange: "X3:Y3", labelStyleId: "fieldLabel", valueStyleId: "fieldValue" },
];

/**
 * §12.3/D-153: row 54, five label-only cells (D-96's own precedent — no
 * distinct value cell, a wet-ink signature goes next to the label on the
 * printed page). Three in the left half, two (wider) in the right half.
 */
const FOOTER_FIELDS: readonly TemplateField[] = [
  { id: "preparedBy", labelRange: "A54:D54", label: "Hazırlayan", valueRange: "A54:D54", labelStyleId: "footerLabel", valueStyleId: "footerLabel" },
  { id: "reviewedBy", labelRange: "E54:H54", label: "Kontrol Eden", valueRange: "E54:H54", labelStyleId: "footerLabel", valueStyleId: "footerLabel" },
  { id: "approvedBy", labelRange: "I54:L54", label: "Onaylayan", valueRange: "I54:L54", labelStyleId: "footerLabel", valueStyleId: "footerLabel" },
  { id: "signature", labelRange: "N54:S54", label: "İmza", valueRange: "N54:S54", labelStyleId: "footerLabel", valueStyleId: "footerLabel" },
  { id: "signOffDate", labelRange: "T54:Y54", label: "Tarih", valueRange: "T54:Y54", labelStyleId: "footerLabel", valueStyleId: "footerLabel" },
];

/**
 * §12.8 (D-158 LOCKED defaults) + D-224's own "2-row header, not 1" finding.
 * Every block maps to exactly one app-step (unlike `farplas-7step-tr`'s
 * merged Step 5+6 block) — §12.6's own note that this simplification is
 * this template's whole point.
 */
const BLOCKS: readonly TemplateBlock[] = [
  {
    appSteps: [1],
    label: "ADIM 1. PROBLEMİ NETLEŞTİRİN",
    headerRange: "A4:L5",
    headerFill: PLAN_FILL,
    headerStyleId: "blockHeaderPlan",
    bodyStyleId: "entryContent",
    contentColumns: { first: "A", last: "L" },
    contentRows: { start: 6, end: 17 },
  },
  {
    appSteps: [2],
    label: "ADIM 2. PROBLEMİ PARÇALARA AYIRIN",
    headerRange: "A18:L19",
    headerFill: PLAN_FILL,
    headerStyleId: "blockHeaderPlan",
    bodyStyleId: "entryContent",
    contentColumns: { first: "A", last: "L" },
    contentRows: { start: 20, end: 45 },
  },
  {
    appSteps: [3],
    label: "ADIM 3. HEDEF BELİRLEYİN",
    headerRange: "A46:L47",
    headerFill: PLAN_FILL,
    headerStyleId: "blockHeaderPlan",
    bodyStyleId: "entryContent",
    contentColumns: { first: "A", last: "L" },
    contentRows: { start: 48, end: 53 },
  },
  {
    appSteps: [4],
    label: "ADIM 4. KÖK NEDENİ ANALİZ EDİN",
    headerRange: "N4:Y5",
    headerFill: PLAN_FILL,
    headerStyleId: "blockHeaderPlan",
    bodyStyleId: "entryContent",
    contentColumns: { first: "N", last: "Y" },
    contentRows: { start: 6, end: 23 },
  },
  {
    appSteps: [5],
    label: "ADIM 5. UYGULAMA PLANI",
    headerRange: "N24:Y25",
    headerFill: DO_FILL,
    headerStyleId: "blockHeaderDo",
    bodyStyleId: "entryContent",
    contentColumns: { first: "N", last: "Y" },
    contentRows: { start: 26, end: 31 },
  },
  {
    appSteps: [6],
    label: "ADIM 6. ÇÖZÜMLERİ UYGULAMA",
    headerRange: "N32:Y33",
    headerFill: DO_FILL,
    headerStyleId: "blockHeaderDo",
    bodyStyleId: "entryContent",
    contentColumns: { first: "N", last: "Y" },
    contentRows: { start: 34, end: 39 },
  },
  {
    appSteps: [7],
    label: "ADIM 7. SONUÇLARI İZLEME",
    headerRange: "N40:Y41",
    headerFill: CHECK_FILL,
    headerStyleId: "blockHeaderCheck",
    bodyStyleId: "entryContent",
    contentColumns: { first: "N", last: "Y" },
    contentRows: { start: 42, end: 47 },
  },
  {
    appSteps: [8],
    label: "ADIM 8. STANDARDİZASYON",
    headerRange: "N48:Y49",
    headerFill: ACT_FILL,
    headerStyleId: "blockHeaderAct",
    bodyStyleId: "entryContent",
    contentColumns: { first: "N", last: "Y" },
    contentRows: { start: 50, end: 53 },
  },
];

const MERGES: readonly MergedRange[] = [
  { range: "A1:Y1" },
  ...HEADER_FIELDS.flatMap((field) => [{ range: field.labelRange }, { range: field.valueRange }]),
  ...FOOTER_FIELDS.map((field) => ({ range: field.labelRange })),
  ...BLOCKS.map((block) => ({ range: block.headerRange })),
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
  staticCells: [],
  footerFields: FOOTER_FIELDS,
  blocks: BLOCKS,
  printArea: "A1:Y54",
  marginsIn: { top: 0.32, bottom: 0.32, left: 0.32, right: 0.32 },
  bodyRowHeightPt: 13,
  zoomPercent: 100,
};
