#![cfg(test)]

use std::path::PathBuf;
use std::sync::atomic::{AtomicU64, Ordering};

static COUNTER: AtomicU64 = AtomicU64::new(0);

/// A scratch directory unique to one test, removed when the guard drops.
/// Nanosecond timestamp + a process-local counter — collision-proof within
/// a single `cargo test` run without pulling in a `tempfile` dependency.
pub struct ScratchDir(pub PathBuf);

impl ScratchDir {
    pub fn new(label: &str) -> Self {
        let nanos = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .expect("system clock before UNIX_EPOCH")
            .as_nanos();
        let n = COUNTER.fetch_add(1, Ordering::Relaxed);
        let dir = std::env::temp_dir().join(format!("pps_hachi_test_{label}_{nanos}_{n}"));
        std::fs::create_dir_all(&dir).expect("create scratch dir");
        Self(dir)
    }

    pub fn path(&self) -> &std::path::Path {
        &self.0
    }
}

impl Drop for ScratchDir {
    fn drop(&mut self) {
        let _ = std::fs::remove_dir_all(&self.0);
    }
}
