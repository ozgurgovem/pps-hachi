/// D-193: mirrors `PpsxError`'s posture (`ppsx/error.rs`) — every variant
/// describes a decode/encode-level failure, never a domain-shape one. A
/// corrupt or unsupported source file is an expected outcome (a user picks
/// the wrong file), not a panic.
#[derive(Debug, thiserror::Error)]
pub enum ImageIngestError {
    #[error("image decode/encode error: {0}")]
    Image(#[from] image::ImageError),
}
