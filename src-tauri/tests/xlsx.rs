//! Phase 4 fidelity test (SPEC.md §6, P-08). "Byte-level regression" isn't
//! achievable — `rust_xlsxwriter` embeds a creation timestamp and zip entry
//! ordering can shift between library versions (P-08). This test instead
//! does a **normalized structural comparison**: it deserializes the exact
//! descriptor `buildA3Layout` produced (checked in by
//! `scripts/gen-a3-fixture.ts`, never hand-written here — same D-62
//! philosophy as the `.ppsx` fixture corpus), writes it with the real
//! `write_a3_workbook`, then reads the result back with `calamine` (cell
//! values, merges) and by inspecting the zip's own XML (print setup, fonts,
//! fills, embedded image) — proving the writer faithfully serializes what
//! the descriptor says, with zero layout decisions of its own (D-04).

use std::io::{Cursor, Read};
use std::path::PathBuf;

use calamine::{Data, DataType, Reader, Xlsx};
use pps_hachi_lib::xlsx::cell_ref::parse_cell_ref;
use pps_hachi_lib::xlsx::descriptor::{A3LayoutDescriptor, CellValue};
use pps_hachi_lib::xlsx::write_a3_workbook;

fn load_descriptor() -> A3LayoutDescriptor {
    let path =
        PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("tests/fixtures/a3-layout-descriptor.json");
    let raw = std::fs::read_to_string(&path)
        .unwrap_or_else(|e| panic!("failed to read {}: {e}", path.display()));
    serde_json::from_str(&raw).unwrap_or_else(|e| panic!("failed to parse descriptor fixture: {e}"))
}

fn read_zip_entry(bytes: &[u8], entry_name: &str) -> Option<String> {
    let mut archive = zip::ZipArchive::new(Cursor::new(bytes)).expect("valid zip");
    let mut file = archive.by_name(entry_name).ok()?;
    let mut contents = String::new();
    file.read_to_string(&mut contents).ok()?;
    Some(contents)
}

fn zip_entry_names(bytes: &[u8]) -> Vec<String> {
    let mut archive = zip::ZipArchive::new(Cursor::new(bytes)).expect("valid zip");
    (0..archive.len())
        .map(|i| archive.by_index(i).expect("entry").name().to_string())
        .collect()
}

/// Round-trip: the project's data survives export. This is the SPEC.md §6
/// Phase 4 done-condition's first half ("a project round-trips to .xlsx").
/// `Range::get_value()` takes **absolute** sheet coordinates (unlike
/// `Range::get()`, which is relative to the used-range's own top-left
/// corner) — required here since our content doesn't start at A1.
#[test]
fn every_cell_in_the_descriptor_reads_back_with_the_same_value() {
    let descriptor = load_descriptor();
    let bytes = write_a3_workbook(&descriptor).expect("workbook should write");

    let mut workbook: Xlsx<_> = Xlsx::new(Cursor::new(bytes)).expect("valid xlsx");
    let range = workbook
        .worksheet_range(&descriptor.sheets.a3.name)
        .expect("A3 sheet should be readable");

    for cell in &descriptor.sheets.a3.cells {
        let Some(expected) = &cell.value else {
            continue;
        };
        let parsed = parse_cell_ref(&cell.cell_ref).expect("valid ref");
        let actual = range
            .get_value((parsed.row, parsed.col as u32))
            .unwrap_or(&Data::Empty);

        match expected {
            CellValue::Text(text) => {
                assert_eq!(
                    actual.get_string(),
                    Some(text.as_str()),
                    "cell {} text mismatch",
                    cell.cell_ref
                );
            }
            CellValue::Number(number) => {
                assert_eq!(
                    actual.get_float(),
                    Some(*number),
                    "cell {} number mismatch",
                    cell.cell_ref
                );
            }
        }
    }
}

/// Fidelity: every appendix sheet named in the descriptor actually exists
/// in the workbook, and never-silently-truncated entries are readable there.
#[test]
fn every_appendix_sheet_is_present_with_its_content() {
    let descriptor = load_descriptor();
    let bytes = write_a3_workbook(&descriptor).expect("workbook should write");
    let mut workbook: Xlsx<_> = Xlsx::new(Cursor::new(bytes)).expect("valid xlsx");
    let sheet_names = workbook.sheet_names();

    assert!(sheet_names.contains(&descriptor.sheets.a3.name));
    for appendix in &descriptor.sheets.appendices {
        assert!(
            sheet_names.contains(&appendix.name),
            "missing appendix sheet {}",
            appendix.name
        );
        let range = workbook
            .worksheet_range(&appendix.name)
            .unwrap_or_else(|e| panic!("{} should be readable: {e}", appendix.name));
        for cell in &appendix.cells {
            let Some(CellValue::Text(text)) = &cell.value else {
                continue;
            };
            let parsed = parse_cell_ref(&cell.cell_ref).expect("valid ref");
            let actual = range
                .get_value((parsed.row, parsed.col as u32))
                .unwrap_or(&Data::Empty);
            assert_eq!(actual.get_string(), Some(text.as_str()));
        }
    }
}

/// Fidelity (SPEC.md §6 Phase 4, grid/merges): the A3 sheet's merged-range
/// count matches the descriptor exactly — this is the geometric backbone
/// TEMPLATE_ANALYSIS.md §9.1 verified against the source .xls (46 merges +
/// content merges added by placement).
#[test]
fn merged_ranges_match_the_descriptor_exactly() {
    let descriptor = load_descriptor();
    let bytes = write_a3_workbook(&descriptor).expect("workbook should write");
    let mut workbook: Xlsx<_> = Xlsx::new(Cursor::new(bytes)).expect("valid xlsx");

    let merges = workbook
        .merge_cells_by_sheet_name(&descriptor.sheets.a3.name)
        .expect("merges should be readable");

    assert_eq!(merges.len(), descriptor.sheets.a3.merges.len());
}

/// Fidelity (print setup): paper size, orientation, fit-to-page and margins
/// come straight from TEMPLATE_ANALYSIS.md §3/§9.4 and must survive export —
/// this is the property the original SPEC.md acceptance test cares about
/// ("prints on one landscape A3 page"). `fitToWidth`/`fitToHeight` are OOXML
/// defaults (1, 1) so rust_xlsxwriter omits them from `<pageSetup>` and
/// signals fit-to-page only via `<sheetPr><pageSetUpPr fitToPage="1"/>`.
#[test]
fn print_setup_matches_the_template_geometry() {
    let descriptor = load_descriptor();
    let bytes = write_a3_workbook(&descriptor).expect("workbook should write");
    let sheet_xml =
        read_zip_entry(&bytes, "xl/worksheets/sheet1.xml").expect("sheet1.xml should exist");

    // Paper size 8 = A3 (rust_xlsxwriter's own documented Excel paper-size table).
    assert!(
        sheet_xml.contains("paperSize=\"8\""),
        "expected A3 paper size in {sheet_xml}"
    );
    assert!(sheet_xml.contains("orientation=\"landscape\""));
    assert!(
        sheet_xml.contains("fitToPage=\"1\""),
        "expected fit-to-page enabled"
    );

    let margins = &descriptor.sheets.a3.page_setup.margins_in;
    assert!(sheet_xml.contains(&format!("left=\"{}\"", margins.left)));
    assert!(sheet_xml.contains(&format!("right=\"{}\"", margins.right)));
    assert!(sheet_xml.contains(&format!("top=\"{}\"", margins.top)));
    assert!(sheet_xml.contains(&format!("bottom=\"{}\"", margins.bottom)));
}

/// Fidelity (fonts/fills): TEMPLATE_ANALYSIS.md §3's typography table — the
/// template is Tahoma throughout, and PDCA header fills use the four
/// documented ARGB colors. Verified directly against `xl/styles.xml`
/// because calamine's cell-value API doesn't expose formatting.
#[test]
fn styles_carry_the_documented_fonts_and_pdca_fill_colors() {
    let descriptor = load_descriptor();
    let bytes = write_a3_workbook(&descriptor).expect("workbook should write");
    let styles_xml = read_zip_entry(&bytes, "xl/styles.xml").expect("styles.xml should exist");

    assert!(
        styles_xml.contains("Tahoma"),
        "expected the Tahoma font family in styles.xml"
    );

    // §3: steps 1-4 red, step 5 yellow, step 6 cyan, step 7 green.
    for pdca_fill in ["FFFF0000", "FFFFFF00", "FF00CCFF", "FF008000"] {
        assert!(
            styles_xml.contains(pdca_fill),
            "expected PDCA fill color {pdca_fill} in styles.xml"
        );
    }
}

/// Fidelity (images): the descriptor's embedded photo/chart PNGs must
/// actually land in the workbook as real media, anchored — not floating,
/// per CLAUDE.md's "Image anchoring in xlsx" warning. Phase 5 (D-102): the
/// fixture now carries five images — one synthetic placement plus one per
/// chart/diagram method (Pareto, Trend, SMART Target's trajectory chart,
/// Fishbone) — proving the `pendingImages` → rasterize → second
/// `buildA3Layout` call pipeline is source-agnostic to Rust by the time it
/// reaches `ImagePlacement`: every declared image lands as real media, not
/// just "at least one."
#[test]
fn embedded_images_land_in_the_workbook_as_real_media() {
    let descriptor = load_descriptor();
    assert!(
        descriptor.sheets.a3.images.len() >= 5,
        "fixture should carry the synthetic image plus one per chart/diagram \
         method (Pareto, Trend, SMART Target, Fishbone) — see scripts/gen-a3-fixture.ts, \
         got {} images",
        descriptor.sheets.a3.images.len()
    );

    let bytes = write_a3_workbook(&descriptor).expect("workbook should write");
    let entries = zip_entry_names(&bytes);
    let media_count = entries
        .iter()
        .filter(|name| name.starts_with("xl/media/"))
        .count();

    assert_eq!(
        media_count,
        descriptor.sheets.a3.images.len(),
        "expected one embedded media file per descriptor image, got entries: {entries:?}"
    );
}

/// Never-silently-truncate (SPEC.md §2.3): an entry the fixture's Step 3
/// budget could not hold must still be readable somewhere in the export.
#[test]
fn every_dropped_entry_id_is_recoverable_from_an_appendix() {
    let descriptor = load_descriptor();
    let bytes = write_a3_workbook(&descriptor).expect("workbook should write");
    let mut workbook: Xlsx<_> = Xlsx::new(Cursor::new(bytes)).expect("valid xlsx");

    let dropped_ids: Vec<&String> = descriptor
        .overflow_warnings
        .iter()
        .flat_map(|w| w.dropped_entry_ids.iter())
        .collect();
    assert!(
        !dropped_ids.is_empty(),
        "fixture should exercise at least one overflow — see scripts/gen-a3-fixture.ts"
    );

    let mut all_appendix_text = String::new();
    for appendix in &descriptor.sheets.appendices {
        let range = workbook
            .worksheet_range(&appendix.name)
            .unwrap_or_else(|e| panic!("{} should be readable: {e}", appendix.name));
        for row in range.rows() {
            for cell in row {
                if let Some(text) = cell.get_string() {
                    all_appendix_text.push_str(text);
                    all_appendix_text.push('\n');
                }
            }
        }
    }

    // The fixture's dropped entry's title text must appear somewhere in an
    // appendix sheet — proving the drop never lost the content outright.
    assert!(
        all_appendix_text.contains("Hedef"),
        "dropped entry content should be recoverable from an appendix; got: {all_appendix_text}"
    );
}

/// G3/D-198: a provisional block's dashed marker must land in the workbook
/// as a real, unfilled, dashed `Shape` — one per `provisionalBlocks` entry —
/// and never touch any cell's own format (the whole reason a floating shape
/// was chosen over per-cell border surgery, see `write_provisional_markers`'s
/// own doc comment). Also proves the a3-only scoping: appendix sheets, which
/// never carry a `provisionalBlocks` entry, get no shape drawing at all.
#[test]
fn provisional_blocks_land_as_unfilled_dashed_shapes_on_the_a3_sheet_only() {
    let descriptor = load_descriptor();
    assert!(
        !descriptor.provisional_blocks.is_empty(),
        "fixture should exercise at least one provisional block — see scripts/gen-a3-fixture.ts"
    );

    let bytes = write_a3_workbook(&descriptor).expect("workbook should write");
    let entries = zip_entry_names(&bytes);
    let drawing_entries: Vec<&String> = entries
        .iter()
        .filter(|name| name.starts_with("xl/drawings/drawing") && name.ends_with(".xml"))
        .collect();

    // The a3 sheet already embeds 5 chart/photo images (its own drawing
    // part) — the shapes must land in that same drawing part alongside them,
    // not a second one, and appendix sheets (plain text, no images, no
    // markers) must gain no drawing part of their own.
    assert_eq!(
        drawing_entries.len(),
        1,
        "expected exactly one drawing part (the a3 sheet's), got: {entries:?}"
    );

    let drawing_xml = read_zip_entry(&bytes, drawing_entries[0]).expect("drawing part readable");
    let shape_count =
        drawing_xml.matches("<xdr:sp ").count() + drawing_xml.matches("<xdr:sp>").count();
    assert_eq!(
        shape_count,
        descriptor.provisional_blocks.len(),
        "expected one <xdr:sp> shape per provisionalBlocks entry, got drawing xml: {drawing_xml}"
    );

    // Unfilled (noFill) and dashed (prstDash val="dash"), never a solid fill
    // that would obscure the block's own content underneath the outline.
    assert!(
        drawing_xml.contains("noFill"),
        "provisional marker shape should have no fill: {drawing_xml}"
    );
    assert!(
        drawing_xml.contains(r#"prstDash val="dash""#),
        "provisional marker shape should use a dashed line: {drawing_xml}"
    );
    assert!(
        drawing_xml.to_lowercase().contains("20241f"),
        "provisional marker shape should use the app's graphite ink (#20241F): {drawing_xml}"
    );
}
