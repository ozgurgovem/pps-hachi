use std::collections::HashMap;
use std::collections::HashSet;

use serde::Serialize;

/// J2/D-205 (`AskUserQuestion`, recommended option): the compact
/// representation SPEC.md §8.9 asks for ("schema + statistics + a
/// stratified sample, not 50,000 rows") — every cell renders as its string
/// form (D-120's own "row-table fields stay string-typed" precedent applied
/// a layer down: a raw cell's real type is a rendering detail, not
/// something the model needs to reason about a second time).
pub const MAX_SAMPLE_ROWS: usize = 30;

/// A column qualifies as a stratification key when its distinct-value ratio
/// sits below this — a column of near-unique values (an ID column, a
/// timestamp) fails the test and `pick_stratify_column` moves to the next
/// column instead.
const STRATIFY_MAX_UNIQUE_RATIO: f64 = 0.5;

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct GroupCount {
    pub value: String,
    pub count: usize,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct IngestedTable {
    pub headers: Vec<String>,
    pub row_count: usize,
    pub sample_rows: Vec<Vec<String>>,
    /// The header name of the column `sample_rows`/`group_counts` were
    /// stratified by, or `None` when no column qualified (falls back to a
    /// plain first-`MAX_SAMPLE_ROWS` sample).
    pub stratified_by: Option<String>,
    pub group_counts: Vec<GroupCount>,
    /// Whether `sample_rows`/`group_counts` had to drop rows or groups to
    /// stay within `MAX_SAMPLE_ROWS` — surfaced to the user in the
    /// attachment review sheet rather than silently truncated (SPEC.md
    /// §8.14's "tell the user what was dropped" applied to a table, not
    /// just a context-window overflow).
    pub truncated: bool,
}

/// Finds the first column whose distinct-value ratio qualifies it as a
/// stratification key (see `STRATIFY_MAX_UNIQUE_RATIO`) — deliberately the
/// *first* qualifying column rather than the "best" one by some scoring
/// function: simple, deterministic, and matches how a Pareto-shaped sheet
/// is conventionally laid out (category first, measurements after).
fn pick_stratify_column(rows: &[Vec<String>]) -> Option<usize> {
    let first_row = rows.first()?;
    let column_count = first_row.len();
    let row_count = rows.len() as f64;

    (0..column_count).find(|&col| {
        let distinct: HashSet<&str> = rows
            .iter()
            .filter_map(|r| r.get(col))
            .map(String::as_str)
            .collect();
        let ratio = distinct.len() as f64 / row_count;
        ratio > 0.0 && ratio <= STRATIFY_MAX_UNIQUE_RATIO
    })
}

/// Groups rows by their value in `col`, preserving first-encounter order —
/// the order the sample/group counts are reported in, so the review sheet
/// reads in the same order the source sheet does rather than an arbitrary
/// hash order.
fn group_rows_by_column(rows: &[Vec<String>], col: usize) -> Vec<(String, Vec<Vec<String>>)> {
    let mut order: Vec<String> = Vec::new();
    let mut groups: HashMap<String, Vec<Vec<String>>> = HashMap::new();
    for row in rows {
        let key = row.get(col).cloned().unwrap_or_default();
        groups.entry(key.clone()).or_insert_with(|| {
            order.push(key.clone());
            Vec::new()
        });
        groups
            .get_mut(&key)
            .expect("just inserted")
            .push(row.clone());
    }
    order
        .into_iter()
        .map(|key| {
            let rows = groups
                .remove(&key)
                .expect("key came from this map's own order list");
            (key, rows)
        })
        .collect()
}

/// The one entry point both `xlsx_source`/`csv_source` funnel through once
/// they've reduced their own library's row type down to plain strings —
/// keeps the sampling/stratification logic independent of which reader
/// produced the rows, and independently unit-testable without a real xlsx
/// or csv file on disk.
pub fn build_ingested_table(headers: Vec<String>, rows: Vec<Vec<String>>) -> IngestedTable {
    let row_count = rows.len();

    match pick_stratify_column(&rows) {
        Some(col) => {
            let groups = group_rows_by_column(&rows, col);
            let truncated = groups.len() > MAX_SAMPLE_ROWS;
            let sample_rows = groups
                .iter()
                .take(MAX_SAMPLE_ROWS)
                .map(|(_, rs)| rs[0].clone())
                .collect();
            let group_counts = groups
                .iter()
                .take(MAX_SAMPLE_ROWS)
                .map(|(value, rs)| GroupCount {
                    value: value.clone(),
                    count: rs.len(),
                })
                .collect();
            IngestedTable {
                headers: headers.clone(),
                row_count,
                sample_rows,
                stratified_by: headers.get(col).cloned(),
                group_counts,
                truncated,
            }
        }
        None => {
            let truncated = rows.len() > MAX_SAMPLE_ROWS;
            let sample_rows = rows.into_iter().take(MAX_SAMPLE_ROWS).collect();
            IngestedTable {
                headers,
                row_count,
                sample_rows,
                stratified_by: None,
                group_counts: Vec::new(),
                truncated,
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn headers() -> Vec<String> {
        vec![
            "Defect Category".to_string(),
            "Line".to_string(),
            "Count".to_string(),
        ]
    }

    fn row(category: &str, line: &str, count: &str) -> Vec<String> {
        vec![category.to_string(), line.to_string(), count.to_string()]
    }

    #[test]
    fn stratifies_by_the_first_column_with_a_low_distinct_value_ratio() {
        let rows = vec![
            row("Scratch", "L1", "1"),
            row("Scratch", "L2", "1"),
            row("Dent", "L1", "1"),
            row("Scratch", "L1", "1"),
            row("Dent", "L2", "1"),
        ];

        let table = build_ingested_table(headers(), rows);

        assert_eq!(table.stratified_by.as_deref(), Some("Defect Category"));
        assert_eq!(table.row_count, 5);
        assert_eq!(table.group_counts.len(), 2);
        let scratch = table
            .group_counts
            .iter()
            .find(|g| g.value == "Scratch")
            .unwrap();
        assert_eq!(scratch.count, 3);
        let dent = table
            .group_counts
            .iter()
            .find(|g| g.value == "Dent")
            .unwrap();
        assert_eq!(dent.count, 2);
        assert_eq!(
            table.sample_rows.len(),
            2,
            "one representative row per distinct category"
        );
        assert!(!table.truncated);
    }

    #[test]
    fn skips_a_near_unique_id_column_and_tries_the_next_one() {
        // Column 0 is a unique serial number per row (fails the ratio test);
        // column 1 repeats and should be picked instead.
        let rows = vec![
            vec!["SN-001".to_string(), "L1".to_string()],
            vec!["SN-002".to_string(), "L1".to_string()],
            vec!["SN-003".to_string(), "L2".to_string()],
            vec!["SN-004".to_string(), "L1".to_string()],
        ];

        let table = build_ingested_table(vec!["Serial".to_string(), "Line".to_string()], rows);

        assert_eq!(table.stratified_by.as_deref(), Some("Line"));
    }

    #[test]
    fn falls_back_to_a_plain_sample_when_every_column_is_near_unique() {
        let rows = vec![
            vec!["SN-001".to_string(), "42.5".to_string()],
            vec!["SN-002".to_string(), "17.3".to_string()],
            vec!["SN-003".to_string(), "9.1".to_string()],
        ];

        let table = build_ingested_table(
            vec!["Serial".to_string(), "Value".to_string()],
            rows.clone(),
        );

        assert_eq!(table.stratified_by, None);
        assert!(table.group_counts.is_empty());
        assert_eq!(table.sample_rows, rows);
    }

    #[test]
    fn caps_the_sample_and_reports_truncation_when_distinct_groups_exceed_the_max() {
        // Each of (MAX_SAMPLE_ROWS + 5) distinct categories repeated 3
        // times — column 0's distinct-value ratio (~0.29) clearly qualifies
        // it as the stratification key ahead of column 1 ("L1" throughout,
        // an even lower ratio, but column 0 is checked first).
        let distinct_categories = MAX_SAMPLE_ROWS + 5;
        let rows: Vec<Vec<String>> = (0..distinct_categories)
            .flat_map(|i| std::iter::repeat_n(row(&format!("Category {i}"), "L1", "1"), 3))
            .collect();

        let table = build_ingested_table(headers(), rows);

        assert_eq!(table.row_count, distinct_categories * 3);
        assert_eq!(table.stratified_by.as_deref(), Some("Defect Category"));
        assert_eq!(table.sample_rows.len(), MAX_SAMPLE_ROWS);
        assert_eq!(table.group_counts.len(), MAX_SAMPLE_ROWS);
        assert!(table.truncated);
    }

    #[test]
    fn caps_a_plain_sample_and_reports_truncation_too() {
        let rows: Vec<Vec<String>> = (0..(MAX_SAMPLE_ROWS + 3))
            .map(|i| vec![format!("SN-{i:04}"), format!("{i}.0")])
            .collect();

        let table = build_ingested_table(vec!["Serial".to_string(), "Value".to_string()], rows);

        assert_eq!(table.sample_rows.len(), MAX_SAMPLE_ROWS);
        assert!(table.truncated);
    }

    #[test]
    fn an_empty_table_reports_zero_rows_and_no_stratification() {
        let table = build_ingested_table(headers(), Vec::new());

        assert_eq!(table.row_count, 0);
        assert_eq!(table.stratified_by, None);
        assert!(table.sample_rows.is_empty());
        assert!(!table.truncated);
    }
}
