#[derive(Debug, thiserror::Error)]
pub enum XlsxWriteError {
    #[error("invalid cell/range reference: {0}")]
    InvalidReference(String),
    #[error("invalid base64 image data for image {id}: {source}")]
    InvalidImageData {
        id: String,
        #[source]
        source: base64::DecodeError,
    },
    #[error(transparent)]
    Xlsx(#[from] rust_xlsxwriter::XlsxError),
}
