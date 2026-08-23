use std::collections::{HashMap, HashSet};

use base64::Engine;
use rust_xlsxwriter::{
    Format, Image, Shape, ShapeFormat, ShapeLine, ShapeLineDashType, Workbook, Worksheet,
};

use super::cell_ref::{parse_cell_ref, parse_range};
use super::descriptor::{
    A3LayoutDescriptor, CellData, CellValue, ProvisionalBlockMarker, SheetDescriptor,
};
use super::error::XlsxWriteError;
use super::styles::build_format_cache;

const PT_TO_PX: f64 = 96.0 / 72.0;

/// D-04: a dumb serializer. Every value written here already exists on the
/// descriptor — this function makes no placement, budget, or overflow
/// decisions of its own. Pure and side-effect-free beyond building the
/// in-memory workbook bytes; no filesystem access.
pub fn write_a3_workbook(descriptor: &A3LayoutDescriptor) -> Result<Vec<u8>, XlsxWriteError> {
    let formats = build_format_cache(&descriptor.styles);
    let default_format = Format::new();

    let mut workbook = Workbook::new();
    write_sheet(
        &mut workbook,
        &descriptor.sheets.a3,
        &formats,
        &default_format,
        &descriptor.provisional_blocks,
    )?;
    for appendix in &descriptor.sheets.appendices {
        // Appendix sheets never carry a provisional marker — `provisionalBlocks`
        // is a3-sheet-only, the same scoping `overflowWarnings` already has.
        write_sheet(&mut workbook, appendix, &formats, &default_format, &[])?;
    }

    Ok(workbook.save_to_buffer()?)
}

fn write_sheet(
    workbook: &mut Workbook,
    sheet: &SheetDescriptor,
    formats: &HashMap<String, Format>,
    default_format: &Format,
    provisional_blocks: &[ProvisionalBlockMarker],
) -> Result<(), XlsxWriteError> {
    let worksheet = workbook.add_worksheet();
    worksheet.set_name(&sheet.name)?;

    write_columns(worksheet, sheet)?;
    write_rows(worksheet, sheet)?;

    let cells_by_ref: HashMap<&str, &CellData> = sheet
        .cells
        .iter()
        .map(|cell| (cell.cell_ref.as_str(), cell))
        .collect();

    let covered = write_merges(worksheet, sheet, &cells_by_ref, formats, default_format)?;
    write_loose_cells(worksheet, sheet, &covered, formats, default_format)?;
    write_images(worksheet, sheet)?;
    write_provisional_markers(worksheet, sheet, provisional_blocks)?;
    apply_page_setup(worksheet, sheet)?;

    Ok(())
}

fn write_columns(worksheet: &mut Worksheet, sheet: &SheetDescriptor) -> Result<(), XlsxWriteError> {
    for column in &sheet.columns {
        let parsed = super::cell_ref::parse_cell_ref(&format!("{}1", column.key))?;
        worksheet.set_column_width(parsed.col, column.char_width)?;
    }
    Ok(())
}

fn write_rows(worksheet: &mut Worksheet, sheet: &SheetDescriptor) -> Result<(), XlsxWriteError> {
    for row in &sheet.rows {
        if row.index == 0 {
            return Err(XlsxWriteError::InvalidReference(format!(
                "row index {} is not 1-based",
                row.index
            )));
        }
        worksheet.set_row_height(row.index - 1, row.height_pt)?;
    }
    Ok(())
}

/// Returns the set of `(row, col)` cells covered by a merge (including the
/// top-left cell, which is written via `merge_range` rather than the loose
/// per-cell write path).
fn write_merges(
    worksheet: &mut Worksheet,
    sheet: &SheetDescriptor,
    cells_by_ref: &HashMap<&str, &CellData>,
    formats: &HashMap<String, Format>,
    default_format: &Format,
) -> Result<HashSet<(u32, u16)>, XlsxWriteError> {
    let mut covered = HashSet::new();

    for merge in &sheet.merges {
        let parsed = parse_range(&merge.range)?;
        for row in parsed.start.row..=parsed.end.row {
            for col in parsed.start.col..=parsed.end.col {
                covered.insert((row, col));
            }
        }

        let top_left_ref = top_left_ref(&merge.range);
        let cell = cells_by_ref.get(top_left_ref.as_str());
        let text = cell
            .and_then(|c| c.value.as_ref())
            .map(cell_value_to_string)
            .unwrap_or_default();
        let format = cell
            .and_then(|c| c.style_id.as_deref())
            .and_then(|id| formats.get(id))
            .unwrap_or(default_format);

        worksheet.merge_range(
            parsed.start.row,
            parsed.start.col,
            parsed.end.row,
            parsed.end.col,
            &text,
            format,
        )?;
    }

    Ok(covered)
}

fn write_loose_cells(
    worksheet: &mut Worksheet,
    sheet: &SheetDescriptor,
    covered: &HashSet<(u32, u16)>,
    formats: &HashMap<String, Format>,
    default_format: &Format,
) -> Result<(), XlsxWriteError> {
    for cell in &sheet.cells {
        let parsed = super::cell_ref::parse_cell_ref(&cell.cell_ref)?;
        if covered.contains(&(parsed.row, parsed.col)) {
            continue;
        }

        let format = cell
            .style_id
            .as_deref()
            .and_then(|id| formats.get(id))
            .unwrap_or(default_format);

        match &cell.value {
            Some(CellValue::Text(text)) => {
                worksheet.write_string_with_format(parsed.row, parsed.col, text, format)?;
            }
            Some(CellValue::Number(number)) => {
                worksheet.write_number_with_format(parsed.row, parsed.col, *number, format)?;
            }
            None => {}
        }
    }
    Ok(())
}

fn write_images(worksheet: &mut Worksheet, sheet: &SheetDescriptor) -> Result<(), XlsxWriteError> {
    for placement in &sheet.images {
        let bytes = base64::engine::general_purpose::STANDARD
            .decode(&placement.data)
            .map_err(|source| XlsxWriteError::InvalidImageData {
                id: placement.id.clone(),
                source,
            })?;

        let mut image = Image::new_from_buffer(&bytes)?;
        let width_px = placement.width_pt * PT_TO_PX;
        let height_px = placement.height_pt * PT_TO_PX;
        image = image.set_scale_to_size(width_px, height_px, false);

        let parsed = super::cell_ref::parse_cell_ref(&placement.anchor_cell)?;
        let x_offset = (placement.offset_x_pt * PT_TO_PX).round() as u32;
        let y_offset = (placement.offset_y_pt * PT_TO_PX).round() as u32;
        worksheet.insert_image_with_offset(parsed.row, parsed.col, &image, x_offset, y_offset)?;
    }
    Ok(())
}

/// G3/D-198: the approved "Aday A" mark — a dashed, unfilled rectangle drawn
/// as a floating `Shape` anchored to the block's top-left cell, never a cell
/// border. A per-cell border overlay (`Worksheet::set_range_format_with_border`)
/// was considered and rejected: it replaces a cell's *entire* existing format
/// (confirmed by reading `rust_xlsxwriter` 0.97.0's `insert_cell_format`,
/// `*xf_index = format_id`), which would have silently stripped D-165/D-41's
/// already-LOCKED PDCA header fills, tone colors, and zone styling from every
/// perimeter cell. A floating shape is the same decoupled-from-cell-format
/// mechanism `write_images` already uses (D-102) — zero risk to any existing
/// style. `#20241F` is the app's own `--graphite` ink (D-49), reused literally
/// so screen and print stay WYSIWYG (D-03); checked against every hex in
/// `TEMPLATE_ANALYSIS.md` §14.1 to confirm zero overlap with D-165's 9
/// semantic colors or D-47's 4 PDCA header fills.
fn write_provisional_markers(
    worksheet: &mut Worksheet,
    sheet: &SheetDescriptor,
    markers: &[ProvisionalBlockMarker],
) -> Result<(), XlsxWriteError> {
    if markers.is_empty() {
        return Ok(());
    }

    let line = ShapeLine::new()
        .set_color("#20241F")
        .set_width(1.5)
        .set_dash_type(ShapeLineDashType::Dash);
    let format = ShapeFormat::new().set_no_fill().set_line(&line);

    for marker in markers {
        let range = parse_range(&marker.range)?;
        let width_px = column_range_width_px(sheet, range.start.col, range.end.col);
        let height_px = row_range_height_pt(sheet, range.start.row, range.end.row) * PT_TO_PX;

        let shape = Shape::textbox()
            .set_width(width_px.round() as u32)
            .set_height(height_px.round() as u32)
            .set_format(&format);
        worksheet.insert_shape(range.start.row, range.start.col, &shape)?;
    }

    Ok(())
}

/// Same "character width → pixel" approximation `src/a3/layout/measure.ts`'s
/// `excelColumnWidthToPt` already uses for the on-screen preview (Calibri-11
/// max-digit-width ≈ 7 px + 5 px padding) — there is no universally-correct
/// conversion (D-04's own comment on `ColumnDef.charWidth`), and a decorative
/// marker shape doesn't need pixel-exact cell-boundary alignment the way a
/// data cell would.
fn column_range_width_px(sheet: &SheetDescriptor, start_col: u16, end_col: u16) -> f64 {
    sheet
        .columns
        .iter()
        .filter_map(|column| {
            let parsed = parse_cell_ref(&format!("{}1", column.key)).ok()?;
            if parsed.col >= start_col && parsed.col <= end_col {
                Some((column.char_width * 7.0 + 5.0).round())
            } else {
                None
            }
        })
        .sum()
}

fn row_range_height_pt(sheet: &SheetDescriptor, start_row: u32, end_row: u32) -> f64 {
    sheet
        .rows
        .iter()
        .filter(|row| {
            let zero_based_index = row.index - 1;
            zero_based_index >= start_row && zero_based_index <= end_row
        })
        .map(|row| row.height_pt)
        .sum()
}

fn apply_page_setup(
    worksheet: &mut Worksheet,
    sheet: &SheetDescriptor,
) -> Result<(), XlsxWriteError> {
    let setup = &sheet.page_setup;

    if setup.paper_size == "A3" {
        worksheet.set_paper_size(8);
    }
    if setup.orientation == "landscape" {
        worksheet.set_landscape();
    }
    if setup.fit_to_page {
        worksheet.set_print_fit_to_pages(setup.fit_to_width, setup.fit_to_height);
    }
    worksheet.set_margins(
        setup.margins_in.left,
        setup.margins_in.right,
        setup.margins_in.top,
        setup.margins_in.bottom,
        0.3,
        0.3,
    );

    let print_area = parse_range(&setup.print_area)?;
    worksheet.set_print_area(
        print_area.start.row,
        print_area.start.col,
        print_area.end.row,
        print_area.end.col,
    )?;

    worksheet.set_zoom(setup.zoom_percent);
    worksheet.set_screen_gridlines(sheet.gridlines_visible);

    Ok(())
}

fn top_left_ref(range: &str) -> String {
    range.split(':').next().unwrap_or(range).to_string()
}

fn cell_value_to_string(value: &CellValue) -> String {
    match value {
        CellValue::Text(text) => text.clone(),
        CellValue::Number(number) => number.to_string(),
    }
}
