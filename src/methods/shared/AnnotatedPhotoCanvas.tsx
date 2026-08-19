import { useState, type PointerEvent as ReactPointerEvent } from "react";
import type { AnnotationShape } from "../../domain/model";
import type { A3EntryAnnotation, A3ImageSize } from "../../a3/methodContract";

/**
 * D-119: uses `A3EntryAnnotation` (the `src/a3` structural mirror, no index
 * signature) rather than the domain model's own `Annotation` (a
 * `z.looseObject` inference, which DOES carry an index signature) —
 * `AnnotatedPhotoCanvas` is shared by both the rasterizer
 * (`defectPhotoBoard/index.ts`'s `renderImage`, which only ever has an
 * `A3EntryAnnotation[]` in hand) and the interactive editor
 * (`EntryAnnotationEditor`, which has real `Annotation[]`). A real
 * `Annotation` is always structurally assignable into a slot asking for the
 * "fewer guarantees" `A3EntryAnnotation` shape, so standardizing on the
 * mirror type here lets both callers pass their own value in without a
 * cast; the one place this genuinely needs to become a domain `Annotation`
 * again — writing back into `Entry.images[].annotations` — casts once, in
 * `EntryImagesField.tsx`, with its own comment explaining why that's safe.
 */
type Annotation = A3EntryAnnotation;

/** Minimum normalized-distance a pointer must move before a new `path` point is recorded — keeps a freehand stroke's point count reasonable instead of one point per `pointermove` event. */
const PATH_MIN_STEP = 0.01;

interface Draft {
  readonly shape: AnnotationShape;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  points: { x: number; y: number }[];
}

function draftToAnnotation(draft: Draft, id: string): Annotation {
  if (draft.shape === "path") {
    return { id, shape: "path", points: draft.points };
  }
  return { id, shape: draft.shape, x0: draft.x0, y0: draft.y0, x1: draft.x1, y1: draft.y1 };
}

/**
 * D-119: draws an arrow's shaft + a small V-shaped head using two strokes
 * (never a filled triangle) — the overlay's `viewBox` is the unit square
 * stretched non-uniformly to the box's real aspect ratio (`preserveAspectRatio="none"`,
 * matching D-118's "stretch, never letterbox" pipeline every embedded image
 * in this app already follows, `writer.rs`'s `set_scale_to_size(..., false)`).
 * A filled polygon head would distort into the wrong shape under that
 * stretch; two stroked segments with `vector-effect="non-scaling-stroke"`
 * keep a constant screen-pixel line weight and stay positionally correct,
 * at the cost of the head's exact angle flexing slightly with the box's
 * aspect ratio — a deliberate, documented trade-off, not an oversight.
 */
function ArrowShape({ x0, y0, x1, y1, className }: { x0: number; y0: number; x1: number; y1: number; className: string }) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;
  const headSize = Math.min(0.04, length * 0.4);
  // Perpendicular-ish head wings, computed in normalized space from the shaft's own direction.
  const backX = x1 - ux * headSize;
  const backY = y1 - uy * headSize;
  const perpX = -uy * headSize * 0.6;
  const perpY = ux * headSize * 0.6;

  return (
    <g className={className}>
      <line x1={x0} y1={y0} x2={x1} y2={y1} vectorEffect="non-scaling-stroke" />
      <line x1={x1} y1={y1} x2={backX + perpX} y2={backY + perpY} vectorEffect="non-scaling-stroke" />
      <line x1={x1} y1={y1} x2={backX - perpX} y2={backY - perpY} vectorEffect="non-scaling-stroke" />
    </g>
  );
}

function AnnotationShapeSvg({ annotation, className }: { annotation: Annotation; className: string }) {
  switch (annotation.shape) {
    case "arrow": {
      const { x0 = 0, y0 = 0, x1 = 0, y1 = 0 } = annotation;
      return <ArrowShape x0={x0} y0={y0} x1={x1} y1={y1} className={className} />;
    }
    case "circle": {
      const { x0 = 0, y0 = 0, x1 = 0, y1 = 0 } = annotation;
      return (
        <ellipse
          cx={(x0 + x1) / 2}
          cy={(y0 + y1) / 2}
          rx={Math.abs(x1 - x0) / 2}
          ry={Math.abs(y1 - y0) / 2}
          className={className}
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
      );
    }
    case "path": {
      const points = annotation.points ?? [];
      if (points.length < 2) {
        return null;
      }
      return (
        <polyline
          points={points.map((point) => `${point.x},${point.y}`).join(" ")}
          className={className}
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
      );
    }
    case "callout":
      return null;
    default:
      return null;
  }
}

/** Callouts render as an HTML overlay, not SVG — the label's font must stay crisp and undistorted under the SVG layer's non-uniform stretch. */
function CalloutMarker({
  annotation,
  interactive,
  onTextChange,
  onCommit,
}: {
  annotation: Annotation;
  interactive: boolean;
  onTextChange?: (text: string) => void;
  onCommit?: () => void;
}) {
  const x0 = annotation.x0 ?? 0;
  const y0 = annotation.y0 ?? 0;
  return (
    <div
      className="absolute flex -translate-y-1/2 items-center gap-1"
      style={{ left: `${x0 * 100}%`, top: `${y0 * 100}%` }}
    >
      <span className="block h-2.5 w-2.5 shrink-0 rounded-full border-2 border-danger bg-danger/70" />
      {interactive ? (
        <input
          className="rounded-control border border-border bg-surface px-1.5 py-0.5 font-body text-xs text-ink shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          value={annotation.text ?? ""}
          placeholder=""
          autoFocus
          onChange={(event) => onTextChange?.(event.target.value)}
          onBlur={onCommit}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onCommit?.();
            }
          }}
        />
      ) : (
        annotation.text && (
          <span className="whitespace-nowrap rounded-control bg-danger/90 px-1.5 py-0.5 font-body text-xs text-white shadow-sm">
            {annotation.text}
          </span>
        )
      )}
    </div>
  );
}

export interface AnnotatedPhotoCanvasProps {
  readonly photoDataUrl: string;
  readonly mimeType: string;
  readonly annotations: readonly Annotation[];
  /** Rasterizer mode (D-102): the explicit pixel box to draw into — omitted in the interactive editor, which sizes itself via CSS. */
  readonly size?: A3ImageSize;
  /** Editor mode: pointer drawing is live, a new shape commits to `annotations` on release. */
  readonly interactive?: boolean;
  /** The shape the next pointer interaction draws; `undefined` disables drawing (view/select only). */
  readonly tool?: AnnotationShape;
  readonly onAnnotationsChange?: (next: readonly Annotation[]) => void;
}

/**
 * D-102/D-103's dual-mode pattern applied a second time (after Fishbone):
 * one implementation renders the same photo+overlay whether it's live in
 * the interactive editor or mounted off-screen for rasterization
 * (`src/a3/render/rasterize.ts`) — never two that could drift.
 */
export function AnnotatedPhotoCanvas({
  photoDataUrl,
  mimeType,
  annotations,
  size,
  interactive = false,
  tool,
  onAnnotationsChange,
}: AnnotatedPhotoCanvasProps) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editingCalloutId, setEditingCalloutId] = useState<string | null>(null);

  const wrapperStyle = size ? { width: `${size.widthPx}px`, height: `${size.heightPx}px` } : undefined;

  function normalizedPoint(event: ReactPointerEvent<HTMLDivElement>): { x: number; y: number } {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.width > 0 ? (event.clientX - rect.left) / rect.width : 0;
    const y = rect.height > 0 ? (event.clientY - rect.top) / rect.height : 0;
    return { x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) };
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!interactive || !tool || !onAnnotationsChange) {
      return;
    }
    const { x, y } = normalizedPoint(event);

    if (tool === "callout") {
      const id = crypto.randomUUID();
      onAnnotationsChange([...annotations, { id, shape: "callout", x0: x, y0: y, text: "" }]);
      setEditingCalloutId(id);
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    setDraft({ shape: tool, x0: x, y0: y, x1: x, y1: y, points: tool === "path" ? [{ x, y }] : [] });
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!draft) {
      return;
    }
    const { x, y } = normalizedPoint(event);
    if (draft.shape === "path") {
      const last = draft.points[draft.points.length - 1];
      if (!last || Math.hypot(x - last.x, y - last.y) >= PATH_MIN_STEP) {
        setDraft({ ...draft, x1: x, y1: y, points: [...draft.points, { x, y }] });
      }
      return;
    }
    setDraft({ ...draft, x1: x, y1: y });
  }

  function handlePointerUp() {
    if (!draft || !onAnnotationsChange) {
      setDraft(null);
      return;
    }
    const isDegenerate =
      draft.shape !== "path" && Math.hypot(draft.x1 - draft.x0, draft.y1 - draft.y0) < 0.005;
    const isTooShortPath = draft.shape === "path" && draft.points.length < 2;
    if (!isDegenerate && !isTooShortPath) {
      onAnnotationsChange([...annotations, draftToAnnotation(draft, crypto.randomUUID())]);
    }
    setDraft(null);
  }

  function commitCalloutText(id: string, text: string) {
    onAnnotationsChange?.(
      annotations
        .map((annotation) => (annotation.id === id ? { ...annotation, text } : annotation))
        .filter((annotation) => annotation.shape !== "callout" || (annotation.text ?? "").trim().length > 0),
    );
  }

  return (
    <div
      className={interactive ? "relative w-full touch-none select-none rounded-control border border-border" : "relative"}
      style={wrapperStyle ?? (interactive ? { aspectRatio: "4 / 3" } : undefined)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => setDraft(null)}
    >
      <img
        src={`data:${mimeType};base64,${photoDataUrl}`}
        alt=""
        className="absolute inset-0 h-full w-full object-fill"
        draggable={false}
      />
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 1 1"
        preserveAspectRatio="none"
      >
        {annotations.map((annotation) => (
          <AnnotationShapeSvg key={annotation.id} annotation={annotation} className="stroke-danger stroke-2" />
        ))}
        {draft && (
          <AnnotationShapeSvg annotation={draftToAnnotation(draft, "__draft__")} className="stroke-danger/60 stroke-2" />
        )}
      </svg>
      {annotations
        .filter((annotation) => annotation.shape === "callout")
        .map((annotation) => (
          <CalloutMarker
            key={annotation.id}
            annotation={annotation}
            interactive={interactive && editingCalloutId === annotation.id}
            onTextChange={(text) => commitCalloutText(annotation.id, text)}
            onCommit={() => setEditingCalloutId(null)}
          />
        ))}
    </div>
  );
}
