use std::collections::HashMap;

use rust_xlsxwriter::{Format, FormatAlign, FormatBorder};

use super::descriptor::{BorderWeight, CellBorder, CellStyle, HorizontalAlign, VerticalAlign};

/// Builds every named `Format` once per export — D-04: purely mechanical
/// translation of the descriptor's own style table, no decisions about
/// which style applies where (that's `buildA3Layout`'s job, on the TS side).
pub fn build_format_cache(styles: &[CellStyle]) -> HashMap<String, Format> {
    styles
        .iter()
        .map(|style| (style.id.clone(), build_format(style)))
        .collect()
}

fn build_format(style: &CellStyle) -> Format {
    let mut format = Format::new()
        .set_font_name(&style.font.name)
        .set_font_size(style.font.size_pt);

    if style.font.bold {
        format = format.set_bold();
    }
    if style.font.italic {
        format = format.set_italic();
    }
    if let Some(color) = &style.font.color {
        format = format.set_font_color(argb_to_rgb(color));
    }
    if let Some(fill) = &style.fill_color {
        format = format.set_background_color(argb_to_rgb(fill));
    }
    if let Some(horizontal) = style.horizontal_align {
        format = format.set_align(to_horizontal_align(horizontal));
    }
    if let Some(vertical) = style.vertical_align {
        format = format.set_align(to_vertical_align(vertical));
    }
    if style.wrap_text {
        format = format.set_text_wrap();
    }
    if let Some(border) = &style.border {
        format = apply_border(format, border);
    }

    format
}

fn apply_border(mut format: Format, border: &CellBorder) -> Format {
    if let Some(weight) = border.top {
        format = format.set_border_top(to_border_weight(weight));
    }
    if let Some(weight) = border.bottom {
        format = format.set_border_bottom(to_border_weight(weight));
    }
    if let Some(weight) = border.left {
        format = format.set_border_left(to_border_weight(weight));
    }
    if let Some(weight) = border.right {
        format = format.set_border_right(to_border_weight(weight));
    }
    if let Some(color) = &border.color {
        format = format.set_border_color(argb_to_rgb(color));
    }
    format
}

fn to_border_weight(weight: BorderWeight) -> FormatBorder {
    match weight {
        BorderWeight::Thin => FormatBorder::Thin,
        BorderWeight::Medium => FormatBorder::Medium,
        BorderWeight::Thick => FormatBorder::Thick,
    }
}

fn to_horizontal_align(align: HorizontalAlign) -> FormatAlign {
    match align {
        HorizontalAlign::Left => FormatAlign::Left,
        HorizontalAlign::Center => FormatAlign::Center,
        HorizontalAlign::Right => FormatAlign::Right,
    }
}

fn to_vertical_align(align: VerticalAlign) -> FormatAlign {
    match align {
        VerticalAlign::Top => FormatAlign::Top,
        VerticalAlign::Center => FormatAlign::VerticalCenter,
        VerticalAlign::Bottom => FormatAlign::Bottom,
    }
}

/// "FFRRGGBB" -> 0xRRGGBB. The descriptor's ARGB strings are always fully
/// opaque (D-03 never emits a translucent fill/font), so the alpha byte is
/// dropped rather than interpreted.
fn argb_to_rgb(argb: &str) -> u32 {
    let rgb_hex = if argb.len() == 8 { &argb[2..] } else { argb };
    u32::from_str_radix(rgb_hex, 16).unwrap_or(0)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn strips_the_alpha_channel_from_an_argb_string() {
        assert_eq!(argb_to_rgb("FFFF0000"), 0x00FF_0000);
        assert_eq!(argb_to_rgb("FF00CCFF"), 0x0000_CCFF);
    }

    #[test]
    fn accepts_a_bare_rgb_string_without_alpha() {
        assert_eq!(argb_to_rgb("00CCFF"), 0x0000_CCFF);
    }
}
