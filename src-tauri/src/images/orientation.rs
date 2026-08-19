use image::DynamicImage;

/// D-118/D-193: applies the pixel transform that makes an image display
/// upright, given a raw EXIF `Orientation` tag value (1-8, TIFF/EXIF spec).
/// `1` and any value outside 1-8 are treated as "already upright" — the safe
/// default for a photo with no EXIF orientation at all.
pub fn apply_orientation(img: DynamicImage, orientation: u32) -> DynamicImage {
    match orientation {
        2 => img.fliph(),
        3 => img.rotate180(),
        4 => img.flipv(),
        5 => img.rotate90().fliph(),
        6 => img.rotate90(),
        7 => img.rotate270().fliph(),
        8 => img.rotate270(),
        _ => img,
    }
}

/// Reads the EXIF `Orientation` tag from raw file bytes. Returns `1`
/// (identity — no correction needed) when the bytes carry no EXIF segment, a
/// malformed one, or no `Orientation` field — a shop-floor photo without
/// EXIF is the common case, not an error.
pub fn read_orientation(bytes: &[u8]) -> u32 {
    let mut cursor = std::io::Cursor::new(bytes);
    let Ok(exif) = exif::Reader::new().read_from_container(&mut cursor) else {
        return 1;
    };
    exif.get_field(exif::Tag::Orientation, exif::In::PRIMARY)
        .and_then(|field| field.value.get_uint(0))
        .filter(|value| (1..=8).contains(value))
        .unwrap_or(1)
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::{Rgb, RgbImage};

    /// A 2x2 grid with four distinct colours — every one of the 8 EXIF
    /// orientation codes produces a distinct pixel arrangement on this
    /// image, so each case below is verified against a hand-derived exact
    /// expected grid (physically rotating/mirroring a 2x2 R/G/B/W square),
    /// not just a "does it compile" smoke test.
    const RED: [u8; 3] = [255, 0, 0];
    const GREEN: [u8; 3] = [0, 255, 0];
    const BLUE: [u8; 3] = [0, 0, 255];
    const WHITE: [u8; 3] = [255, 255, 255];

    fn sample() -> DynamicImage {
        // row0: R G
        // row1: B W
        let mut img = RgbImage::new(2, 2);
        img.put_pixel(0, 0, Rgb(RED));
        img.put_pixel(1, 0, Rgb(GREEN));
        img.put_pixel(0, 1, Rgb(BLUE));
        img.put_pixel(1, 1, Rgb(WHITE));
        DynamicImage::ImageRgb8(img)
    }

    fn pixel(img: &DynamicImage, x: u32, y: u32) -> [u8; 3] {
        let rgb = img.to_rgb8();
        rgb.get_pixel(x, y).0
    }

    fn grid(img: &DynamicImage) -> [[u8; 3]; 4] {
        [
            pixel(img, 0, 0),
            pixel(img, 1, 0),
            pixel(img, 0, 1),
            pixel(img, 1, 1),
        ]
    }

    #[test]
    fn orientation_1_is_identity() {
        let result = apply_orientation(sample(), 1);
        assert_eq!(grid(&result), [RED, GREEN, BLUE, WHITE]);
    }

    #[test]
    fn orientation_2_flips_horizontally() {
        let result = apply_orientation(sample(), 2);
        assert_eq!(grid(&result), [GREEN, RED, WHITE, BLUE]);
    }

    #[test]
    fn orientation_3_rotates_180() {
        let result = apply_orientation(sample(), 3);
        assert_eq!(grid(&result), [WHITE, BLUE, GREEN, RED]);
    }

    #[test]
    fn orientation_4_flips_vertically() {
        let result = apply_orientation(sample(), 4);
        assert_eq!(grid(&result), [BLUE, WHITE, RED, GREEN]);
    }

    #[test]
    fn orientation_5_transposes() {
        let result = apply_orientation(sample(), 5);
        assert_eq!(grid(&result), [RED, BLUE, GREEN, WHITE]);
    }

    #[test]
    fn orientation_6_rotates_90_clockwise() {
        let result = apply_orientation(sample(), 6);
        assert_eq!(grid(&result), [BLUE, RED, WHITE, GREEN]);
    }

    #[test]
    fn orientation_7_transverses() {
        let result = apply_orientation(sample(), 7);
        assert_eq!(grid(&result), [WHITE, GREEN, BLUE, RED]);
    }

    #[test]
    fn orientation_8_rotates_270_clockwise() {
        let result = apply_orientation(sample(), 8);
        assert_eq!(grid(&result), [GREEN, WHITE, RED, BLUE]);
    }

    #[test]
    fn unrecognized_orientation_code_defaults_to_identity() {
        let result = apply_orientation(sample(), 0);
        assert_eq!(grid(&result), [RED, GREEN, BLUE, WHITE]);
        let result = apply_orientation(sample(), 9);
        assert_eq!(grid(&result), [RED, GREEN, BLUE, WHITE]);
    }

    #[test]
    fn rotate_90_then_270_round_trips_to_the_original() {
        let rotated = apply_orientation(sample(), 6);
        let restored = apply_orientation(rotated, 8);
        assert_eq!(grid(&restored), grid(&sample()));
    }

    #[test]
    fn read_orientation_defaults_to_1_when_no_exif_segment_present() {
        assert_eq!(read_orientation(b"not an image at all"), 1);
        assert_eq!(read_orientation(&[]), 1);
    }
}
