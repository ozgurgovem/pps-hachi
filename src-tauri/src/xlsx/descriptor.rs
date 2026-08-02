//! Serde mirror of `src/a3/descriptor.ts`. D-04: this module holds data
//! shapes only — no layout decisions. Every struct is `rename_all =
//! "camelCase"` so the JSON crossing the Tauri IPC boundary needs no
//! per-field renames to match the TypeScript source of truth.

use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CellFont {
    pub name: String,
    pub size_pt: f64,
    #[serde(default)]
    pub bold: bool,
    #[serde(default)]
    pub italic: bool,
    pub color: Option<String>,
}

#[derive(Debug, Clone, Copy, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum BorderWeight {
    Thin,
    Medium,
    Thick,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CellBorder {
    pub top: Option<BorderWeight>,
    pub bottom: Option<BorderWeight>,
    pub left: Option<BorderWeight>,
    pub right: Option<BorderWeight>,
    pub color: Option<String>,
}

#[derive(Debug, Clone, Copy, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum HorizontalAlign {
    Left,
    Center,
    Right,
}

#[derive(Debug, Clone, Copy, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum VerticalAlign {
    Top,
    Center,
    Bottom,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CellStyle {
    pub id: String,
    pub font: CellFont,
    pub fill_color: Option<String>,
    pub horizontal_align: Option<HorizontalAlign>,
    pub vertical_align: Option<VerticalAlign>,
    #[serde(default)]
    pub wrap_text: bool,
    pub border: Option<CellBorder>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(untagged)]
pub enum CellValue {
    Text(String),
    Number(f64),
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CellData {
    #[serde(rename = "ref")]
    pub cell_ref: String,
    pub value: Option<CellValue>,
    pub style_id: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct MergedRange {
    pub range: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ColumnDef {
    pub key: String,
    pub char_width: f64,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RowDef {
    pub index: u32,
    pub height_pt: f64,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImagePlacement {
    pub id: String,
    /// Base64-encoded image bytes. The writer never reads from disk (D-04).
    pub data: String,
    pub mime_type: String,
    pub anchor_cell: String,
    #[serde(default)]
    pub offset_x_pt: f64,
    #[serde(default)]
    pub offset_y_pt: f64,
    pub width_pt: f64,
    pub height_pt: f64,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PageMarginsIn {
    pub top: f64,
    pub bottom: f64,
    pub left: f64,
    pub right: f64,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PageSetup {
    pub paper_size: String,
    pub orientation: String,
    pub fit_to_page: bool,
    pub fit_to_width: u16,
    pub fit_to_height: u16,
    pub margins_in: PageMarginsIn,
    pub print_area: String,
    pub zoom_percent: u16,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SheetDescriptor {
    pub name: String,
    pub columns: Vec<ColumnDef>,
    pub rows: Vec<RowDef>,
    pub merges: Vec<MergedRange>,
    pub cells: Vec<CellData>,
    pub images: Vec<ImagePlacement>,
    pub page_setup: PageSetup,
    pub freeze_panes: bool,
    pub gridlines_visible: bool,
}

#[derive(Debug, Clone, Deserialize)]
pub struct Sheets {
    pub a3: SheetDescriptor,
    pub appendices: Vec<SheetDescriptor>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OverflowWarning {
    pub step_ids: Vec<u8>,
    pub budget_pt: f64,
    pub content_pt: f64,
    pub overflow_by_pt: f64,
    pub dropped_entry_ids: Vec<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct A3LayoutDescriptor {
    pub template_id: String,
    pub language: String,
    pub styles: Vec<CellStyle>,
    pub sheets: Sheets,
    pub overflow_warnings: Vec<OverflowWarning>,
}
