import type { CellStyle, ColumnDef, MergedRange, RowDef } from "../descriptor";
import type { A3Template, TemplateBlock, TemplateField, TemplateStaticCell } from "./types";

/**
 * Geometry transcribed from `reference/TEMPLATE_ANALYSIS.md` §3 and §9
 * (source-verified 2026-08-01, D-09/D-35/D-37 LOCKED). TR row indices are
 * ENG − 1 throughout (§9.5: TR has no spacer row) — every row/merge/block
 * reference here is TR-native, already shifted; do not re-derive from the
 * ENG table by hand elsewhere.
 *
 * D-40: template-native body text (14 pt) is legible on screen but not on
 * the printed page at this template's ~41.5 % fit scale. Two distinct
 * styles exist for that reason — `bodyCell` (14 pt, the template's own
 * static/instructional cells) and `entryContent` (19 pt, user-authored
 * entry text) — never conflate them.
 */

function rowsInRange(startIndex: number, endIndex: number, heightPt: number): RowDef[] {
  const rows: RowDef[] = [];
  for (let index = startIndex; index <= endIndex; index += 1) {
    rows.push({ index, heightPt });
  }
  return rows;
}

const TR_ROWS: readonly RowDef[] = [
  { index: 1, heightPt: 38.5 },
  ...rowsInRange(2, 6, 20.15),
  ...rowsInRange(7, 55, 30),
  { index: 56, heightPt: 93.75 },
  { index: 57, heightPt: 30 },
  { index: 58, heightPt: 153.75 },
  { index: 59, heightPt: 18 },
  { index: 60, heightPt: 17.5 },
  { index: 61, heightPt: 18.5 },
  { index: 62, heightPt: 18 },
];

const TR_COLUMNS: readonly ColumnDef[] = [
  { key: "A", charWidth: 1.54 },
  { key: "B", charWidth: 20.73 },
  { key: "C", charWidth: 20.73 },
  { key: "D", charWidth: 2.27 },
  { key: "E", charWidth: 23.63 },
  { key: "F", charWidth: 22.63 },
  { key: "G", charWidth: 22.63 },
  { key: "H", charWidth: 2.73 },
  { key: "I", charWidth: 23.63 },
  { key: "J", charWidth: 22.63 },
  { key: "K", charWidth: 22.63 },
  { key: "L", charWidth: 2.73 },
  { key: "M", charWidth: 23.63 },
  { key: "N", charWidth: 44.63 },
  { key: "O", charWidth: 0.82 },
  { key: "P", charWidth: 3.27 },
  { key: "Q", charWidth: 23.63 },
  { key: "R", charWidth: 22.63 },
  { key: "S", charWidth: 22.63 },
  { key: "T", charWidth: 22.0 },
  { key: "U", charWidth: 20.63 },
  { key: "V", charWidth: 20.63 },
  { key: "W", charWidth: 20.63 },
  { key: "X", charWidth: 20.63 },
  { key: "Y", charWidth: 20.63 },
  { key: "Z", charWidth: 20.63 },
  { key: "AA", charWidth: 20.63 },
  { key: "AB", charWidth: 20.63 },
  { key: "AC", charWidth: 2.0 },
];

// §3/§9.1: 46 merged ranges, confirmed against both source files. TR rows = ENG − 1.
const TR_MERGES: readonly MergedRange[] = [
  { range: "B1:AB1" }, // title
  // header band
  { range: "B2:C3" },
  { range: "D2:F3" },
  { range: "G2:G3" },
  { range: "H2:J3" },
  { range: "K2:K3" },
  { range: "L2:O3" },
  { range: "P2:Q3" },
  { range: "R2:S3" },
  { range: "T2:T3" },
  // team
  { range: "B4:C6" },
  { range: "D4:E4" },
  { range: "F4:G4" },
  { range: "J4:K4" },
  { range: "N4:O4" },
  { range: "R4:S4" },
  { range: "T4:T6" },
  { range: "F5:G5" },
  { range: "J5:K5" },
  { range: "N5:O5" },
  { range: "R5:S5" },
  { range: "F6:G6" },
  { range: "J6:K6" },
  { range: "N6:O6" },
  { range: "R6:S6" },
  // work-plan dates (2 rows per step column)
  { range: "U5:U6" },
  { range: "V5:V6" },
  { range: "W5:W6" },
  { range: "X5:X6" },
  { range: "Y5:Y6" },
  { range: "Z5:Z6" },
  { range: "AA5:AA6" },
  { range: "AB5:AB6" },
  // block headers
  { range: "B7:O7" },
  { range: "P7:AB7" },
  { range: "B22:O22" },
  { range: "P22:AB22" },
  { range: "P36:AB36" },
  { range: "P55:AB55" },
  { range: "B57:O57" },
  { range: "B58:O58" },
  // footer
  { range: "J59:M59" },
  { range: "N59:Q59" },
  { range: "R59:T59" },
  { range: "U59:X59" },
  { range: "Y59:AA59" },
];

const FONT_FAMILY = "Tahoma";
const WHITE = "FFFFFFFF";
const BLACK = "FF000000";

const TR_STYLES: readonly CellStyle[] = [
  {
    id: "title",
    font: { name: FONT_FAMILY, sizePt: 20, bold: true },
    horizontalAlign: "center",
    verticalAlign: "center",
    border: { top: "medium", bottom: "medium", left: "medium", right: "medium" },
  },
  {
    id: "fieldLabel",
    font: { name: FONT_FAMILY, sizePt: 18, bold: true },
    fillColor: "FFC0C0C0",
    horizontalAlign: "left",
    verticalAlign: "center",
    wrapText: true,
  },
  {
    id: "fieldValue",
    font: { name: FONT_FAMILY, sizePt: 12, bold: true },
    horizontalAlign: "center",
    verticalAlign: "center",
  },
  {
    id: "lossTypeLabel",
    font: { name: FONT_FAMILY, sizePt: 14, bold: true },
    horizontalAlign: "left",
    verticalAlign: "center",
    wrapText: true,
  },
  {
    id: "lossTypeCategory",
    font: { name: FONT_FAMILY, sizePt: 11 },
    horizontalAlign: "center",
    verticalAlign: "center",
    wrapText: true,
  },
  {
    id: "blockHeaderPlan",
    font: { name: FONT_FAMILY, sizePt: 18, bold: true, color: WHITE },
    fillColor: "FFFF0000",
    horizontalAlign: "left",
    verticalAlign: "bottom",
    wrapText: true,
  },
  {
    id: "blockHeaderDo",
    font: { name: FONT_FAMILY, sizePt: 18, bold: true, color: BLACK },
    fillColor: "FFFFFF00",
    horizontalAlign: "left",
    verticalAlign: "bottom",
    wrapText: true,
  },
  {
    id: "blockHeaderCheck",
    font: { name: FONT_FAMILY, sizePt: 18, bold: true, color: BLACK },
    fillColor: "FF00CCFF",
    horizontalAlign: "left",
    verticalAlign: "bottom",
    wrapText: true,
  },
  {
    id: "blockHeaderAct",
    font: { name: FONT_FAMILY, sizePt: 18, bold: true, color: BLACK },
    fillColor: "FF008000",
    horizontalAlign: "left",
    verticalAlign: "bottom",
    wrapText: true,
  },
  {
    id: "bodyCell",
    font: { name: FONT_FAMILY, sizePt: 14 },
    horizontalAlign: "left",
    verticalAlign: "top",
    wrapText: true,
  },
  {
    id: "entryContent",
    font: { name: FONT_FAMILY, sizePt: 19 },
    horizontalAlign: "left",
    verticalAlign: "top",
    wrapText: true,
  },
  {
    id: "entryContentBold",
    font: { name: FONT_FAMILY, sizePt: 19, bold: true },
    horizontalAlign: "left",
    verticalAlign: "top",
    wrapText: true,
  },
  /**
   * P-37: tone-reinforced variants of `entryContent`/`entryContentBold`,
   * one triple per bold/non-bold. Colours are D-165's Layer A palette
   * (§14.1) — green=positive/done, blue=caution/in progress,
   * red=negative/blocked (D-41 read at §14.3) — reused, never redefined.
   */
  {
    id: "entryContentPositive",
    font: { name: FONT_FAMILY, sizePt: 19, color: "FF8FBF4F" },
    horizontalAlign: "left",
    verticalAlign: "top",
    wrapText: true,
  },
  {
    id: "entryContentCaution",
    font: { name: FONT_FAMILY, sizePt: 19, color: "FF4A90D9" },
    horizontalAlign: "left",
    verticalAlign: "top",
    wrapText: true,
  },
  {
    id: "entryContentNegative",
    font: { name: FONT_FAMILY, sizePt: 19, color: "FFE0342A" },
    horizontalAlign: "left",
    verticalAlign: "top",
    wrapText: true,
  },
  {
    id: "entryContentBoldPositive",
    font: { name: FONT_FAMILY, sizePt: 19, bold: true, color: "FF8FBF4F" },
    horizontalAlign: "left",
    verticalAlign: "top",
    wrapText: true,
  },
  {
    id: "entryContentBoldCaution",
    font: { name: FONT_FAMILY, sizePt: 19, bold: true, color: "FF4A90D9" },
    horizontalAlign: "left",
    verticalAlign: "top",
    wrapText: true,
  },
  {
    id: "entryContentBoldNegative",
    font: { name: FONT_FAMILY, sizePt: 19, bold: true, color: "FFE0342A" },
    horizontalAlign: "left",
    verticalAlign: "top",
    wrapText: true,
  },
  /**
   * D-224 (Faz 11/L1): Layer A goal-state *fill* styles (§14.1) — light
   * green/blue/red fills with black text (the same D-165 v2 hex values
   * `entryContentPositive`/etc already use for font-only reinforcement),
   * used by `gapStatement`'s Problem Statement bands via `fillStyleId`.
   * Added here too (not just `pps-8step-auto.ts`) so a project still on this
   * legacy-compatibility template renders the same bands, not a colourless
   * fallback.
   */
  {
    id: "bandPositive",
    font: { name: FONT_FAMILY, sizePt: 14, color: BLACK },
    fillColor: "FF8FBF4F",
    horizontalAlign: "left",
    verticalAlign: "center",
    wrapText: true,
  },
  {
    id: "bandCaution",
    font: { name: FONT_FAMILY, sizePt: 14, color: BLACK },
    fillColor: "FF4A90D9",
    horizontalAlign: "left",
    verticalAlign: "center",
    wrapText: true,
  },
  {
    id: "bandNegative",
    font: { name: FONT_FAMILY, sizePt: 14, color: BLACK },
    fillColor: "FFE0342A",
    horizontalAlign: "left",
    verticalAlign: "center",
    wrapText: true,
  },
  /**
   * D-224: Layer B 5N1K category chip fills (§14.1), six colours, white text
   * (kept dark enough to carry contrast per §14.1's own note). Used by
   * `fiveN1K`'s six question labels via `fillStyleId`.
   */
  {
    id: "fiveN1kNe",
    font: { name: FONT_FAMILY, sizePt: 14, color: WHITE },
    fillColor: "FFC68A2E",
    horizontalAlign: "left",
    verticalAlign: "center",
    wrapText: true,
  },
  {
    id: "fiveN1kNeden",
    font: { name: FONT_FAMILY, sizePt: 14, color: WHITE },
    fillColor: "FF5F4470",
    horizontalAlign: "left",
    verticalAlign: "center",
    wrapText: true,
  },
  {
    id: "fiveN1kNasil",
    font: { name: FONT_FAMILY, sizePt: 14, color: WHITE },
    fillColor: "FF2F7A6E",
    horizontalAlign: "left",
    verticalAlign: "center",
    wrapText: true,
  },
  {
    id: "fiveN1kKim",
    font: { name: FONT_FAMILY, sizePt: 14, color: WHITE },
    fillColor: "FF8B3A5C",
    horizontalAlign: "left",
    verticalAlign: "center",
    wrapText: true,
  },
  {
    id: "fiveN1kNeZaman",
    font: { name: FONT_FAMILY, sizePt: 14, color: WHITE },
    fillColor: "FF8A5A3B",
    horizontalAlign: "left",
    verticalAlign: "center",
    wrapText: true,
  },
  {
    id: "fiveN1kNerede",
    font: { name: FONT_FAMILY, sizePt: 14, color: WHITE },
    fillColor: "FF556677",
    horizontalAlign: "left",
    verticalAlign: "center",
    wrapText: true,
  },
  {
    id: "footerLabel",
    font: { name: FONT_FAMILY, sizePt: 14, bold: true },
    horizontalAlign: "left",
    verticalAlign: "center",
    wrapText: true,
  },
  {
    id: "footerValue",
    font: { name: FONT_FAMILY, sizePt: 12 },
    horizontalAlign: "center",
    verticalAlign: "center",
  },
  {
    id: "footerDateValue",
    font: { name: FONT_FAMILY, sizePt: 12 },
    horizontalAlign: "center",
    verticalAlign: "center",
  },
];

// §4/§9.7: TR header field labels, own row (2 = ENG 3).
const TR_HEADER_FIELDS: readonly TemplateField[] = [
  {
    id: "champion",
    labelRange: "B2:C3",
    label: "Sorumlu",
    valueRange: "D2:F3",
    labelStyleId: "fieldLabel",
    valueStyleId: "fieldValue",
  },
  {
    id: "kaizenNo",
    labelRange: "G2:G3",
    label: "Kaizen No",
    valueRange: "H2:J3",
    labelStyleId: "fieldLabel",
    valueStyleId: "fieldValue",
  },
  {
    id: "subject",
    labelRange: "K2:K3",
    label: "Konu",
    valueRange: "L2:O3",
    labelStyleId: "fieldLabel",
    valueStyleId: "fieldValue",
  },
  {
    id: "department",
    labelRange: "P2:Q3",
    label: "Müdürlük",
    valueRange: "R2:S3",
    labelStyleId: "fieldLabel",
    valueStyleId: "fieldValue",
  },
];

/**
 * §4/§9.1: only 5 footer ranges are actually merged (`J59:M59`, `N59:Q59`,
 * `R59:T59`, `U59:X59`, `Y59:AA59`). `B59`/`F59`/`AB59` are unmerged single
 * cells (see `TR_STATIC_CELLS`), not `TemplateField`s. `N59:Q59`'s TR label
 * is unconfirmed in `reference/TEMPLATE_ANALYSIS.md` (§9's TR footer-label
 * recitation lists 7 words for 8 cell groups) — left blank rather than
 * guessed, per CLAUDE.md's "do not silently invent scope."
 *
 * None of these three approval cells has a distinct value cell in the
 * source form — on paper the label *is* the whole cell, and sign-off is a
 * wet-ink signature next to it, not typed data. `resolveFooterFieldValue`
 * therefore never returns non-empty for these — see DECISIONS.md D-96 for
 * why `ProjectModel.signOff` is not exported into the sheet yet.
 */
const TR_FOOTER_FIELDS: readonly TemplateField[] = [
  {
    id: "realizedIncome",
    labelRange: "J59:M59",
    label: "GERÇEKLEŞEN GETİRİ",
    valueRange: "J59:M59",
    labelStyleId: "footerLabel",
    valueStyleId: "footerValue",
  },
  {
    id: "approval1",
    labelRange: "R59:T59",
    label: "ONAY 1",
    valueRange: "R59:T59",
    labelStyleId: "footerLabel",
    valueStyleId: "footerValue",
  },
  {
    id: "approval2",
    labelRange: "U59:X59",
    label: "ONAY 2",
    valueRange: "U59:X59",
    labelStyleId: "footerLabel",
    valueStyleId: "footerValue",
  },
  {
    id: "managerApproval",
    labelRange: "Y59:AA59",
    label: "MÜD-YÖN. ONAYI",
    valueRange: "Y59:AA59",
    labelStyleId: "footerLabel",
    valueStyleId: "footerValue",
  },
];

// §9.6/D-36: TR loss taxonomy — 8 categories (TR splits maintenance; ENG has 7).
const TR_LOSS_CATEGORIES = [
  "İş Güvenliği",
  "Maliyet",
  "Verimlilik",
  "Kalite",
  "Bağı. Bakım",
  "Prof. Bakım",
  "İnsan Kayn.",
  "Çevre",
] as const;

const TR_LOSS_COLUMNS = ["U", "V", "W", "X", "Y", "Z", "AA", "AB"] as const;

// §4: work-plan step labels, row 4 (= ENG row 5), one per column, unmerged.
const TR_WORK_PLAN_STEPS = [
  "1.Adım",
  "2.Adım",
  "3.Adım",
  "4.Adım",
  "5.Adım",
  "6.Adım",
  "7.Adım",
  "Sunum",
] as const;

const TR_STATIC_CELLS: readonly TemplateStaticCell[] = [
  { ref: "T2", value: "Kayıp Cinsi", styleId: "lossTypeLabel" },
  ...TR_LOSS_CATEGORIES.map((value, i) => ({
    ref: `${TR_LOSS_COLUMNS[i]}2`,
    value,
    styleId: "lossTypeCategory",
  })),
  { ref: "T4", value: "Çalışma Planı", styleId: "fieldLabel" },
  ...TR_WORK_PLAN_STEPS.map((value, i) => ({
    ref: `${TR_LOSS_COLUMNS[i]}4`,
    value,
    styleId: "lossTypeCategory",
  })),
  { ref: "B4", value: "Çalışma Ekibi", styleId: "fieldLabel" },
  // §4/§9.1: B59/F59/AB59 are unmerged single footer cells, not part of the 46 merges.
  { ref: "B59", value: "KAZANÇ", styleId: "footerLabel" },
  { ref: "F59", value: "MALİYET", styleId: "footerLabel" },
  { ref: "AB59", value: "ONAY TARİHİ", styleId: "footerLabel" },
];

// §3 block map, TR rows (ENG − 1). appSteps map per §1 of TEMPLATE_ANALYSIS.md.
const TR_BLOCKS: readonly TemplateBlock[] = [
  {
    appSteps: [1],
    label: "1. PROBLEMİN TANIMLANMASI",
    headerRange: "B7:O7",
    headerFill: "FFFF0000",
    headerStyleId: "blockHeaderPlan",
    bodyStyleId: "entryContent",
    contentColumns: { first: "B", last: "O" },
    contentRows: { start: 8, end: 21 },
  },
  {
    appSteps: [2],
    label: "2. MEVCUT DURUM ANALİZİ",
    headerRange: "B22:O22",
    headerFill: "FFFF0000",
    headerStyleId: "blockHeaderPlan",
    bodyStyleId: "entryContent",
    contentColumns: { first: "B", last: "O" },
    contentRows: { start: 23, end: 56 },
  },
  {
    appSteps: [3],
    label: "3. HEDEF BELİRLEME",
    headerRange: "B57:O57",
    headerFill: "FFFF0000",
    headerStyleId: "blockHeaderPlan",
    bodyStyleId: "entryContent",
    contentColumns: { first: "B", last: "O" },
    contentRows: { start: 58, end: 58 },
  },
  {
    appSteps: [4],
    label: "4. KÖK NEDEN ANALİZİ",
    headerRange: "P7:AB7",
    headerFill: "FFFF0000",
    headerStyleId: "blockHeaderPlan",
    bodyStyleId: "entryContent",
    contentColumns: { first: "P", last: "AB" },
    contentRows: { start: 8, end: 21 },
  },
  {
    appSteps: [5, 6],
    label: "5. KARŞI ÖNLEMLERİN BELİRLENMESİ VE FAALİYET PLANLARI",
    headerRange: "P22:AB22",
    headerFill: "FFFFFF00",
    headerStyleId: "blockHeaderDo",
    bodyStyleId: "entryContent",
    contentColumns: { first: "P", last: "AB" },
    contentRows: { start: 23, end: 35 },
  },
  {
    appSteps: [7],
    label: "6. SONUÇLARIN KONTROLÜ",
    headerRange: "P36:AB36",
    headerFill: "FF00CCFF",
    headerStyleId: "blockHeaderCheck",
    bodyStyleId: "entryContent",
    contentColumns: { first: "P", last: "AB" },
    contentRows: { start: 37, end: 54 },
  },
  {
    appSteps: [8],
    label: "7. STANDARDİZASYON",
    headerRange: "P55:AB55",
    headerFill: "FF008000",
    headerStyleId: "blockHeaderAct",
    bodyStyleId: "entryContent",
    contentColumns: { first: "P", last: "AB" },
    contentRows: { start: 56, end: 58 },
  },
];

export const farplas7StepTr: A3Template = {
  id: "farplas-7step-tr",
  name: "Farplas 7 Adımlı Major Kaizen Formu (TR)",
  language: "tr",
  columns: TR_COLUMNS,
  rows: TR_ROWS,
  merges: TR_MERGES,
  styles: TR_STYLES,
  titleRange: "B1:AB1",
  headerFields: TR_HEADER_FIELDS,
  staticCells: TR_STATIC_CELLS,
  footerFields: TR_FOOTER_FIELDS,
  blocks: TR_BLOCKS,
  // §9.4: printArea $B$1:$AB$62, margins 6/6/5/5mm = 0.2362/0.2362/0.1969/0.1969 in.
  printArea: "B1:AB62",
  marginsIn: { top: 0.1969, bottom: 0.1969, left: 0.2362, right: 0.2362 },
  bodyRowHeightPt: 30,
  zoomPercent: 70,
};
