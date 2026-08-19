import { describe, expect, it } from "vitest";
import { AnnotationSchema, EntrySchema, ImageRefSchema } from "./entry";

describe("AnnotationSchema", () => {
  it("parses an arrow (x0,y0 tail to x1,y1 head)", () => {
    const parsed = AnnotationSchema.parse({ id: "a1", shape: "arrow", x0: 0.1, y0: 0.2, x1: 0.5, y1: 0.6 });

    expect(parsed).toMatchObject({ shape: "arrow", x0: 0.1, y0: 0.2, x1: 0.5, y1: 0.6 });
  });

  it("parses a circle (bounding-box corners)", () => {
    const parsed = AnnotationSchema.parse({ id: "a2", shape: "circle", x0: 0.2, y0: 0.2, x1: 0.4, y1: 0.4 });

    expect(parsed.shape).toBe("circle");
  });

  it("parses a callout (anchor point plus text)", () => {
    const parsed = AnnotationSchema.parse({ id: "a3", shape: "callout", x0: 0.5, y0: 0.5, text: "Burr here" });

    expect(parsed).toMatchObject({ shape: "callout", text: "Burr here" });
  });

  it("parses a path (a polyline of normalized points)", () => {
    const points = [
      { x: 0.1, y: 0.1 },
      { x: 0.2, y: 0.15 },
      { x: 0.3, y: 0.4 },
    ];
    const parsed = AnnotationSchema.parse({ id: "a4", shape: "path", points });

    expect(parsed.points).toEqual(points);
  });

  it("rejects an unknown shape", () => {
    expect(AnnotationSchema.safeParse({ id: "a5", shape: "square", x0: 0, y0: 0 }).success).toBe(false);
  });

  it("preserves unknown keys (D-51 loose object)", () => {
    const parsed = AnnotationSchema.parse({ id: "a6", shape: "arrow", x0: 0, y0: 0, note: "future field" });

    expect(parsed).toMatchObject({ note: "future field" });
  });
});

describe("ImageRefSchema with annotations", () => {
  it("parses an image with an annotations array", () => {
    const annotations = [{ id: "a1", shape: "circle" as const, x0: 0.1, y0: 0.1, x1: 0.2, y1: 0.2 }];
    const parsed = ImageRefSchema.parse({ id: "img-1", assetPath: "assets/img_img-1.jpg", annotations });

    expect(parsed.annotations).toEqual(annotations);
  });

  /** D-119: additive — every photo ingested before 6e-2 carries no `annotations` field at all. */
  it("parses a pre-6e-2 image that has no annotations field", () => {
    const parsed = ImageRefSchema.parse({ id: "img-1", assetPath: "assets/img_img-1.jpg" });

    expect(parsed.annotations).toBeUndefined();
    expect("annotations" in parsed).toBe(false);
  });
});

const baseEntry = {
  id: "e1",
  methodId: "defect-photo-board",
  title: "Flash on cavity 3",
  order: 0,
  a3Visibility: "primary" as const,
  payload: {},
  createdAt: "2026-08-19T00:00:00.000Z",
  updatedAt: "2026-08-19T00:00:00.000Z",
  provenance: { origin: "human" as const },
};

describe("EntrySchema with annotated images", () => {
  it("round-trips an image whose annotations array is non-empty", () => {
    const images = [
      {
        id: "img-1",
        assetPath: "assets/img_img-1.jpg",
        annotations: [{ id: "a1", shape: "arrow" as const, x0: 0, y0: 0, x1: 1, y1: 1 }],
      },
    ];

    expect(EntrySchema.parse({ ...baseEntry, images }).images).toEqual(images);
  });
});
