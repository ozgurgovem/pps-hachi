use std::collections::{HashMap, HashSet};

use base64::Engine;
use rust_xlsxwriter::{Format, Image, Workbook, Worksheet};

use super::cell_ref::parse_range;
use super::descriptor::{A3LayoutDescriptor, CellData, CellValue, SheetDescriptor};
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
    )?;
    for appendix in &descriptor.sheets.appendices {
        write_sheet(&mut workbook, appendix, &formats, &default_format)?;
    }

    Ok(workbook.save_to_buffer()?)
}

fn write_sheet(
    workbook: &mut Workbook,
    sheet: &SheetDescriptor,
    formats: &HashMap<String, Format>,
    default_format: &Format,
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
