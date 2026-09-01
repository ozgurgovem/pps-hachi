/// D-200/D-193's own posture repeated a third time: every variant describes
/// a real read/decode-level failure an actual call site constructs, never a
/// domain-shape one. `Xlsx`/`Csv` fold "corrupt file"/"password-protected
/// file"/"unsupported internal format" into the underlying library's own
/// error text — neither library exposes those as distinct error variants,
/// so inventing our own finer-grained taxonomy on top would be
/// undoc­umented guesswork.
#[derive(Debug, thiserror::Error)]
pub enum IngestError {
    #[error("could not read the file: {0}")]
    Io(#[from] std::io::Error),

    #[error("could not read the spreadsheet: {0}")]
    Xlsx(#[from] calamine::Error),

    #[error("could not read the csv file: {0}")]
    Csv(#[from] csv::Error),

    #[error("the file is larger than the {max_mb} MB limit")]
    FileTooLarge { max_mb: u64 },

    #[error("unsupported file type \".{0}\" — only .xlsx and .csv are supported")]
    UnsupportedExtension(String),

    #[error("the sheet has no data")]
    EmptySheet,
}
