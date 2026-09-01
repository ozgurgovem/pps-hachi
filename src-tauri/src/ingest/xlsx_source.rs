use std::path::Path;

use calamine::{open_workbook_auto, Data, Reader};

use super::error::IngestError;
use super::table::{build_ingested_table, IngestedTable};

/// J2/D-205: reads only the first worksheet — real single-purpose quality-
/// data exports (a Pareto breakdown, a defect log) are conventionally one
/// sheet, and a sheet picker is real, separable scope this dilim's own
/// budget doesn't cover. `calamine::Reader::worksheet_range_at`/`headers`/
/// `rows` verified against the real docs.rs API for 0.36.1 before writing
/// this — not coded from memory (CLAUDE.md's own rule).
pub fn ingest_xlsx(path: &Path) -> Result<IngestedTable, IngestError> {
    let mut workbook = open_workbook_auto(path).map_err(IngestError::Xlsx)?;
    let range = workbook
        .worksheet_range_at(0)
        .ok_or(IngestError::EmptySheet)?
        .map_err(IngestError::Xlsx)?;

    let headers = range.headers().ok_or(IngestError::EmptySheet)?;
    let rows: Vec<Vec<String>> = range
        .rows()
        .skip(1) // `rows()` includes the header row `headers()` already extracted
        .map(|row| row.iter().map(data_to_string).collect())
        .collect();

    Ok(build_ingested_table(headers, rows))
}

/// Every `Data` variant rendered as its display text — a cell's real
/// calamine type is a detail the model doesn't need a second time (this
/// crate's own D-120 precedent: row-table fields already stay string-typed
/// throughout the TS side). `Data` does not implement `Display` itself
/// (verified against the real docs.rs page before writing this), so this
/// matches by hand rather than assuming a `.to_string()` that doesn't exist.
fn data_to_string(cell: &Data) -> String {
    match cell {
        Data::Empty => String::new(),
        Data::String(s) => s.clone(),
        Data::Int(i) => i.to_string(),
        Data::Float(f) => f.to_string(),
        Data::Bool(b) => b.to_string(),
        Data::DateTimeIso(s) | Data::DurationIso(s) => s.clone(),
        Data::DateTime(dt) => dt.to_string(),
        Data::Error(e) => format!("#ERROR:{e:?}"),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::ppsx::test_support::ScratchDir;
    use rust_xlsxwriter::Workbook;

    fn write_sample_xlsx(path: &std::path::Path) {
        let mut workbook = Workbook::new();
        let sheet = workbook.add_worksheet();
        sheet.write(0, 0, "Defect Category").unwrap();
        sheet.write(0, 1, "Count").unwrap();
        sheet.write(1, 0, "Scratch").unwrap();
        sheet.write(1, 1, 42).unwrap();
        sheet.write(2, 0, "Dent").unwrap();
        sheet.write(2, 1, 17).unwrap();
        workbook.save(path).unwrap();
    }

    #[test]
    fn reads_headers_and_rows_from_a_real_xlsx_file() {
        let dir = ScratchDir::new("ingest_xlsx_real_file");
        let path = dir.path().join("sample.xlsx");
        write_sample_xlsx(&path);

        let table = ingest_xlsx(&path).unwrap();

        assert_eq!(table.headers, vec!["Defect Category", "Count"]);
        assert_eq!(table.row_count, 2);
        assert_eq!(table.stratified_by.as_deref(), None); // only 2 rows, both categories unique — no repetition to stratify on
    }

    #[test]
    fn a_sheet_with_only_a_header_row_reports_zero_data_rows() {
        let dir = ScratchDir::new("ingest_xlsx_header_only");
        let path = dir.path().join("headers_only.xlsx");
        let mut workbook = Workbook::new();
        let sheet = workbook.add_worksheet();
        sheet.write(0, 0, "Column A").unwrap();
        workbook.save(&path).unwrap();

        let table = ingest_xlsx(&path).unwrap();

        assert_eq!(table.headers, vec!["Column A"]);
        assert_eq!(table.row_count, 0);
    }

    #[test]
    fn a_genuinely_empty_sheet_is_an_empty_sheet_error() {
        let dir = ScratchDir::new("ingest_xlsx_empty_sheet");
        let path = dir.path().join("empty.xlsx");
        let mut workbook = Workbook::new();
        workbook.add_worksheet();
        workbook.save(&path).unwrap();

        let err = ingest_xlsx(&path).unwrap_err();

        assert!(matches!(err, IngestError::EmptySheet));
    }

    #[test]
    fn a_corrupt_file_is_an_xlsx_error_not_a_panic() {
        let dir = ScratchDir::new("ingest_xlsx_corrupt");
        let path = dir.path().join("not_really_xlsx.xlsx");
        std::fs::write(&path, b"this is not a real spreadsheet").unwrap();

        let err = ingest_xlsx(&path).unwrap_err();

        assert!(matches!(err, IngestError::Xlsx(_)));
    }
}
