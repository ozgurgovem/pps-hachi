pub mod commands;
mod csv_source;
mod error;
mod table;
mod xlsx_source;

pub use error::IngestError;
pub use table::{GroupCount, IngestedTable};

use csv_source::ingest_csv;
use std::path::Path;
use xlsx_source::ingest_xlsx;

/// J2/D-118's own fixed-number precedent (2400px/JPEG-85, D-193) applied
/// here: a single sane cap rather than a Settings-configurable one — a
/// user-adjustable "Attachment policy" is SPEC.md §8.4's own scope,
/// deliberately out of this dilim's budget (§3).
const MAX_SOURCE_FILE_BYTES: u64 = 25 * 1024 * 1024;

/// Dispatches on file extension — deliberately narrower than what
/// `calamine` alone could read (it also handles `.xls`/`.xlsb`/`.ods`):
/// D-203's own scope decision keeps this dilim to xlsx/csv only, matching
/// the file picker's own filter on the TS side.
pub fn ingest_table_from_path(path: &Path) -> Result<IngestedTable, IngestError> {
    let metadata = std::fs::metadata(path)?;
    if metadata.len() > MAX_SOURCE_FILE_BYTES {
        return Err(IngestError::FileTooLarge {
            max_mb: MAX_SOURCE_FILE_BYTES / (1024 * 1024),
        });
    }

    let extension = path
        .extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or_default()
        .to_ascii_lowercase();
    match extension.as_str() {
        "csv" => ingest_csv(path),
        "xlsx" => ingest_xlsx(path),
        other => Err(IngestError::UnsupportedExtension(other.to_string())),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::ppsx::test_support::ScratchDir;

    #[test]
    fn rejects_an_unsupported_extension_before_touching_either_reader() {
        let dir = ScratchDir::new("ingest_dispatch_unsupported");
        let path = dir.path().join("data.pdf");
        std::fs::write(&path, b"not a spreadsheet").unwrap();

        let err = ingest_table_from_path(&path).unwrap_err();

        assert!(matches!(err, IngestError::UnsupportedExtension(ext) if ext == "pdf"));
    }

    #[test]
    fn rejects_a_file_over_the_size_cap_before_reading_its_content() {
        let dir = ScratchDir::new("ingest_dispatch_too_large");
        let path = dir.path().join("huge.csv");
        // One byte over the cap — a real spreadsheet-sized allocation
        // would be wasteful for a unit test; the cap check reads only
        // `fs::metadata`, never the file's bytes, so this is enough to
        // prove the check runs before the csv reader ever opens it.
        let file = std::fs::File::create(&path).unwrap();
        file.set_len(MAX_SOURCE_FILE_BYTES + 1).unwrap();

        let err = ingest_table_from_path(&path).unwrap_err();

        assert!(matches!(err, IngestError::FileTooLarge { .. }));
    }

    #[test]
    fn dispatches_csv_extension_case_insensitively() {
        let dir = ScratchDir::new("ingest_dispatch_csv_uppercase");
        let path = dir.path().join("sample.CSV");
        std::fs::write(&path, "A,B\n1,2\n").unwrap();

        let table = ingest_table_from_path(&path).unwrap();

        assert_eq!(table.headers, vec!["A", "B"]);
    }
}
