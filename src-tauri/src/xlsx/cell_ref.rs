//! A1-notation parsing — the Rust-side mirror of `src/a3/cellRef.ts`. Pure
//! address arithmetic, not layout logic (D-04): translating "B8" into
//! rust_xlsxwriter's 0-based `(row, col)` is the same category of work as
//! handing `charWidth` to `set_column_width` verbatim.

use super::error::XlsxWriteError;

pub struct ParsedCellRef {
    pub row: u32,
    pub col: u16,
}

pub fn parse_cell_ref(cell_ref: &str) -> Result<ParsedCellRef, XlsxWriteError> {
    let split_at = cell_ref
        .find(|c: char| c.is_ascii_digit())
        .ok_or_else(|| XlsxWriteError::InvalidReference(cell_ref.to_string()))?;
    let (letters, digits) = cell_ref.split_at(split_at);
    if letters.is_empty() || digits.is_empty() {
        return Err(XlsxWriteError::InvalidReference(cell_ref.to_string()));
    }
    let row_one_based: u32 = digits
        .parse()
        .map_err(|_| XlsxWriteError::InvalidReference(cell_ref.to_string()))?;
    if row_one_based == 0 {
        return Err(XlsxWriteError::InvalidReference(cell_ref.to_string()));
    }
    Ok(ParsedCellRef {
        row: row_one_based - 1,
        col: column_letters_to_index(letters)?,
    })
}

pub struct ParsedRange {
    pub start: ParsedCellRef,
    pub end: ParsedCellRef,
}

pub fn parse_range(range: &str) -> Result<ParsedRange, XlsxWriteError> {
    match range.split_once(':') {
        Some((start, end)) => Ok(ParsedRange {
            start: parse_cell_ref(start)?,
            end: parse_cell_ref(end)?,
        }),
        None => {
            let single = parse_cell_ref(range)?;
            Ok(ParsedRange {
                start: ParsedCellRef {
                    row: single.row,
                    col: single.col,
                },
                end: ParsedCellRef {
                    row: single.row,
                    col: single.col,
                },
            })
        }
    }
}

/// 0-based: A=0, B=1, …, Z=25, AA=26, AB=27, …
fn column_letters_to_index(letters: &str) -> Result<u16, XlsxWriteError> {
    if letters.is_empty() || !letters.chars().all(|c| c.is_ascii_uppercase()) {
        return Err(XlsxWriteError::InvalidReference(letters.to_string()));
    }
    let mut index: u32 = 0;
    for c in letters.chars() {
        index = index * 26 + (c as u32 - 'A' as u32 + 1);
    }
    u16::try_from(index - 1).map_err(|_| XlsxWriteError::InvalidReference(letters.to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_a_simple_reference_to_zero_based_row_col() {
        let parsed = parse_cell_ref("B8").unwrap();
        assert_eq!(parsed.row, 7);
        assert_eq!(parsed.col, 1);
    }

    #[test]
    fn parses_two_letter_columns() {
        let parsed = parse_cell_ref("AB59").unwrap();
        assert_eq!(parsed.row, 58);
        assert_eq!(parsed.col, 27);
    }

    #[test]
    fn rejects_a_malformed_reference() {
        assert!(parse_cell_ref("8B").is_err());
        assert!(parse_cell_ref("B").is_err());
        assert!(parse_cell_ref("").is_err());
    }

    #[test]
    fn parses_a_range_into_start_and_end() {
        let parsed = parse_range("B2:C3").unwrap();
        assert_eq!(parsed.start.row, 1);
        assert_eq!(parsed.start.col, 1);
        assert_eq!(parsed.end.row, 2);
        assert_eq!(parsed.end.col, 2);
    }

    #[test]
    fn treats_a_single_cell_range_as_start_equals_end() {
        let parsed = parse_range("AB59").unwrap();
        assert_eq!(parsed.start.row, parsed.end.row);
        assert_eq!(parsed.start.col, parsed.end.col);
    }
}
