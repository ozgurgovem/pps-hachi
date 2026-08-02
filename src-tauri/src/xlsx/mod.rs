//! Descriptor → workbook. D-04: zero layout logic — every field consumed
//! here already carries a decision made by `buildA3Layout` (TS, `src/a3/`).
//! This module only translates already-decided values into
//! `rust_xlsxwriter` API calls.

pub mod cell_ref;
pub mod descriptor;
mod error;
mod styles;
mod writer;

pub use descriptor::A3LayoutDescriptor;
pub use error::XlsxWriteError;
pub use writer::write_a3_workbook;
