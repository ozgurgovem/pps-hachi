use std::path::Path;

use super::error::IngestError;
use super::table::{build_ingested_table, IngestedTable};

/// J2/D-205: `csv::Reader::from_path`/`headers`/`records` verified against
/// docs.rs for `csv` 1.4.0 before writing this — calamine has no CSV reader
/// at all (verified the same way), so this is a genuinely separate code
/// path, not a thin wrapper reusing `xlsx_source`.
pub fn ingest_csv(path: &Path) -> Result<IngestedTable, IngestError> {
    let mut reader = csv::Reader::from_path(path)?;
    let headers: Vec<String> = reader.headers()?.iter().map(String::from).collect();
    if headers.is_empty() {
        return Err(IngestError::EmptySheet);
    }

    let mut rows: Vec<Vec<String>> = Vec::new();
    for record in reader.records() {
        rows.push(record?.iter().map(String::from).collect());
    }

    Ok(build_ingested_table(headers, rows))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::ppsx::test_support::ScratchDir;

    #[test]
    fn reads_headers_and_rows_from_a_real_csv_file() {
        let dir = ScratchDir::new("ingest_csv_real_file");
        let path = dir.path().join("sample.csv");
        std::fs::write(&path, "Defect Category,Count\nScratch,42\nDent,17\n").unwrap();

        let table = ingest_csv(&path).unwrap();

        assert_eq!(table.headers, vec!["Defect Category", "Count"]);
        assert_eq!(table.row_count, 2);
    }

    /// The `csv` crate's own quoting/escaping rules (RFC 4180) — the exact
    /// reason a hand-rolled parser was rejected in this dilim's own design
    /// round.
    #[test]
    fn handles_quoted_fields_containing_commas_and_escaped_quotes() {
        let dir = ScratchDir::new("ingest_csv_quoted_fields");
        let path = dir.path().join("quoted.csv");
        std::fs::write(
            &path,
            "Note,Count\n\"Scratch, minor\",3\n\"He said \"\"stop\"\"\",1\n",
        )
        .unwrap();

        let table = ingest_csv(&path).unwrap();

        assert_eq!(table.sample_rows.len(), 2);
        let notes: Vec<&str> = table
            .sample_rows
            .iter()
            .map(|row| row[0].as_str())
            .collect();
        assert!(notes.contains(&"Scratch, minor"));
        assert!(notes.contains(&"He said \"stop\""));
    }

    #[test]
    fn a_header_only_csv_reports_zero_data_rows() {
        let dir = ScratchDir::new("ingest_csv_header_only");
        let path = dir.path().join("headers_only.csv");
        std::fs::write(&path, "Column A,Column B\n").unwrap();

        let table = ingest_csv(&path).unwrap();

        assert_eq!(table.headers, vec!["Column A", "Column B"]);
        assert_eq!(table.row_count, 0);
    }

    #[test]
    fn a_genuinely_empty_file_is_an_empty_sheet_error() {
        let dir = ScratchDir::new("ingest_csv_empty_file");
        let path = dir.path().join("empty.csv");
        std::fs::write(&path, "").unwrap();

        let err = ingest_csv(&path).unwrap_err();

        assert!(matches!(err, IngestError::EmptySheet));
    }

    #[test]
    fn a_missing_file_is_a_csv_error_not_a_panic() {
        let dir = ScratchDir::new("ingest_csv_missing_file");
        let path = dir.path().join("does_not_exist.csv");

        let err = ingest_csv(&path).unwrap_err();

        assert!(matches!(err, IngestError::Csv(_)));
    }
}
