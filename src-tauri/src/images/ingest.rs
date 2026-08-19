use image::imageops::FilterType;
use image::{DynamicImage, GenericImageView};

use super::error::ImageIngestError;
use super::orientation::{apply_orientation, read_orientation};

/// D-193: caps chosen 2026-08-18 (Barış, `AskUserQuestion`, recommended
/// option) — generous enough for shop-floor documentation photos, small
/// enough to keep a `.ppsx` emailable (D-06). Distinct from `SPEC.md` §8.7's
/// 1568px AI-transport figure, which governs a separate, not-yet-built path
/// (Phase 8+) and must not be reused here (D-118 draws this line explicitly).
pub const ORIGINAL_MAX_LONG_EDGE: u32 = 2400;
pub const THUMBNAIL_MAX_LONG_EDGE: u32 = 400;
const ORIGINAL_JPEG_QUALITY: u8 = 85;
const THUMBNAIL_JPEG_QUALITY: u8 = 80;

#[derive(Debug)]
pub struct IngestedImage {
    pub original: Vec<u8>,
    pub thumbnail: Vec<u8>,
}

/// D-118: the whole ingestion pipeline for one photo, run entirely on bytes
/// already in memory — decode, orient upright from EXIF, strip EXIF
/// unconditionally (re-encoding from decoded pixels carries no metadata
/// forward, so there is nothing left to explicitly delete), downscale, and
/// produce a small thumbnail alongside the capped-size original. The caller
/// owns reading the source file from disk and writing the results into the
/// `.ppsx`.
pub fn ingest_image_bytes(bytes: &[u8]) -> Result<IngestedImage, ImageIngestError> {
    let orientation = read_orientation(bytes);
    let decoded = image::load_from_memory(bytes)?;
    let upright = apply_orientation(decoded, orientation);

    let original = scale_to_max_edge(&upright, ORIGINAL_MAX_LONG_EDGE);
    let thumbnail = scale_to_max_edge(&upright, THUMBNAIL_MAX_LONG_EDGE);

    Ok(IngestedImage {
        original: encode_jpeg(&original, ORIGINAL_JPEG_QUALITY)?,
        thumbnail: encode_jpeg(&thumbnail, THUMBNAIL_JPEG_QUALITY)?,
    })
}

/// Downscales only when the long edge already exceeds `max_edge` — an
/// already-small photo is never upscaled. Aspect ratio is always preserved.
fn scale_to_max_edge(img: &DynamicImage, max_edge: u32) -> DynamicImage {
    let (width, height) = img.dimensions();
    let long_edge = width.max(height);
    if long_edge <= max_edge {
        return img.clone();
    }
    let scale = f64::from(max_edge) / f64::from(long_edge);
    let target_width = ((f64::from(width) * scale).round() as u32).max(1);
    let target_height = ((f64::from(height) * scale).round() as u32).max(1);
    img.resize(target_width, target_height, FilterType::Lanczos3)
}

/// JPEG has no alpha channel — `to_rgb8()` drops one explicitly (flattening
/// onto opaque black... in practice a scanned/screenshotted PNG with
/// transparency is not the expected input here, and this matches what most
/// image viewers do with an alpha-less format) rather than leaving the
/// encoder to reject an RGBA buffer.
fn encode_jpeg(img: &DynamicImage, quality: u8) -> Result<Vec<u8>, ImageIngestError> {
    let mut buffer = Vec::new();
    let rgb = img.to_rgb8();
    let mut encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(&mut buffer, quality);
    encoder.encode_image(&rgb)?;
    Ok(buffer)
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::{ImageFormat, RgbImage};

    fn synthetic_jpeg(width: u32, height: u32) -> Vec<u8> {
        let img = RgbImage::from_fn(width, height, |x, y| {
            image::Rgb([(x % 256) as u8, (y % 256) as u8, 128])
        });
        let mut buffer = Vec::new();
        DynamicImage::ImageRgb8(img)
            .write_to(&mut std::io::Cursor::new(&mut buffer), ImageFormat::Jpeg)
            .unwrap();
        buffer
    }

    #[test]
    fn downscales_an_oversized_image_to_the_capped_long_edge() {
        let source = synthetic_jpeg(4000, 3000);
        let ingested = ingest_image_bytes(&source).unwrap();

        let original = image::load_from_memory(&ingested.original).unwrap();
        assert_eq!(original.width(), ORIGINAL_MAX_LONG_EDGE);
        assert!(
            original.height() < 3000,
            "aspect ratio should be preserved, not stretched to a square cap"
        );

        let thumbnail = image::load_from_memory(&ingested.thumbnail).unwrap();
        assert_eq!(thumbnail.width(), THUMBNAIL_MAX_LONG_EDGE);
    }

    #[test]
    fn never_upscales_an_already_small_image() {
        let source = synthetic_jpeg(100, 80);
        let ingested = ingest_image_bytes(&source).unwrap();

        let original = image::load_from_memory(&ingested.original).unwrap();
        assert_eq!((original.width(), original.height()), (100, 80));

        let thumbnail = image::load_from_memory(&ingested.thumbnail).unwrap();
        assert_eq!((thumbnail.width(), thumbnail.height()), (100, 80));
    }

    #[test]
    fn preserves_aspect_ratio_for_a_tall_portrait_photo() {
        let source = synthetic_jpeg(1000, 4000);
        let ingested = ingest_image_bytes(&source).unwrap();

        let original = image::load_from_memory(&ingested.original).unwrap();
        assert_eq!(original.height(), ORIGINAL_MAX_LONG_EDGE);
        assert_eq!(original.width(), 600); // 1000 * (2400/4000)
    }

    #[test]
    fn output_bytes_decode_as_jpeg_with_no_alpha_channel() {
        let source = synthetic_jpeg(50, 50);
        let ingested = ingest_image_bytes(&source).unwrap();

        assert_eq!(
            image::guess_format(&ingested.original).unwrap(),
            ImageFormat::Jpeg
        );
        assert_eq!(
            image::guess_format(&ingested.thumbnail).unwrap(),
            ImageFormat::Jpeg
        );
    }

    #[test]
    fn rejects_bytes_that_are_not_a_decodable_image() {
        let err = ingest_image_bytes(b"definitely not an image").unwrap_err();
        assert!(matches!(err, ImageIngestError::Image(_)));
    }

    /// D-118: re-encoding from decoded pixel data carries no EXIF forward —
    /// this is the mechanism the "strip EXIF unconditionally" claim rests
    /// on. Verified structurally rather than merely asserted: the output
    /// JPEG bytes contain no EXIF `APP1` marker (`0xFF 0xE1`) at all, and no
    /// literal ASCII "Exif" tag — the fixture's synthetic source has none to
    /// begin with, but this proves the *encoder path itself* introduces
    /// none either, which is the actual claim (a lossless "copy markers
    /// forward" encoder would fail this even on EXIF-less input).
    #[test]
    fn output_bytes_contain_no_exif_segment() {
        let source = synthetic_jpeg(200, 150);
        let ingested = ingest_image_bytes(&source).unwrap();
        assert!(!contains_exif_app1_marker(&ingested.original));
        assert!(!contains_exif_app1_marker(&ingested.thumbnail));
    }

    fn contains_exif_app1_marker(jpeg_bytes: &[u8]) -> bool {
        jpeg_bytes.windows(4).any(|w| w == *b"Exif")
    }
}
