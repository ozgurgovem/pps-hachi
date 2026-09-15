import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useTranslation } from "react-i18next";
import { QUADRANT_COLORS, quadrantOf, scoreValue, type Quadrant } from "./quadrant";
import type { ImpactEffortItem } from "./schema";

/**
 * P-27 §1 question 1/2 (Barış, 2026-09-15, both his own recommended option):
 * score stays the primary data — the schema, `quadrant.ts` and `renderToA3.ts`
 * are untouched by this file. Dragging is only an alternate INPUT METHOD for
 * the same two numeric fields the Editor already renders, and only which
 * quadrant the pointer is released in matters — fine position inside a
 * quadrant carries no separate meaning, so every drop is snapped to one of
 * these two representative values per axis (never the dragged-to pixel).
 * `4`/`2` sit on the "high"/"low" side of `quadrantOf`'s own midpoint (impact
 * ≥3 is high, effort ≤2 is low) without landing exactly on either boundary.
 */
const HIGH_SCORE = "4";
const LOW_SCORE = "2";

/**
 * A pointer down+up with essentially no movement is a stray click/tap, not
 * a drag — same purpose as `AnnotatedPhotoCanvas.tsx`'s own `isDegenerate`
 * distance check (there guarding against a zero-length drawn shape; here
 * guarding against silently flattening an already-precise score, e.g.
 * impact `5` → the coarse `4`, just because the dot was clicked without
 * being meaningfully moved).
 */
const MIN_DRAG_DISTANCE = 0.02;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** Same split `quadrantOf` uses (impact ≥3 high, effort ≤2 low), applied to a live 0..1 drag point instead of a stored score. */
function quadrantFromPoint(x: number, y: number): Quadrant {
  const highImpact = y < 0.5;
  const lowEffort = x < 0.5;
  if (highImpact && lowEffort) {
    return "quick-win";
  }
  if (highImpact) {
    return "major-project";
  }
  if (lowEffort) {
    return "fill-in";
  }
  return "thankless-task";
}

/**
 * Screen position for one item, 0..1 in both axes. A scored item's position
 * comes straight from its real 1–5 scores (continuous — two items that both
 * count as "high impact" still show at different heights if their scores
 * differ), matching `ImpactEffortChart.tsx`'s own export fidelity. An
 * unscored item has no score to derive a position from; it's placed in a
 * small deterministic cluster around the canvas centre (a golden-angle
 * spiral by list index) so several unscored items land close to the
 * crossing lines — visually "not yet decided" — without exactly overlapping
 * and becoming unclickable.
 */
function positionOf(item: ImpactEffortItem, unscoredIndex: number): { x: number; y: number } {
  const impact = scoreValue(item.impact);
  const effort = scoreValue(item.effort);
  if (impact !== undefined && effort !== undefined) {
    return { x: clamp01((effort - 1) / 4), y: clamp01(1 - (impact - 1) / 4) };
  }
  const angle = (unscoredIndex * 137.5 * Math.PI) / 180;
  const radius = 0.05 + (unscoredIndex % 3) * 0.025;
  return { x: clamp01(0.5 + radius * Math.cos(angle)), y: clamp01(0.5 + radius * Math.sin(angle)) };
}

interface DragState {
  readonly itemId: string;
  readonly startX: number;
  readonly startY: number;
  readonly x: number;
  readonly y: number;
}

export interface ImpactEffortCanvasProps {
  readonly items: readonly ImpactEffortItem[];
  readonly onScoreChange: (itemId: string, impact: string, effort: string) => void;
}

/**
 * P-27's own new mechanism: a free-position drag surface over the 1–5
 * impact/effort scores the Editor's numeric inputs already edit — both
 * stay live and two-way in sync (Barış's own choice, §1 question 3), so
 * keyboard-only use is already covered by those inputs without this canvas
 * needing its own arrow-key repositioning (unlike `BlockPinOverlay`'s
 * single-axis D-170 pattern, which has no equivalent numeric fallback).
 * Pointer handling follows `AnnotatedPhotoCanvas.tsx`'s own established
 * shape (D-119): `setPointerCapture` on the dragged element, a normalized
 * 0..1 point computed against a separate container ref (not the dragged
 * chip's own, smaller rect).
 */
export function ImpactEffortCanvas({ items, onScoreChange }: ImpactEffortCanvasProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);

  function normalizedPoint(clientX: number, clientY: number): { x: number; y: number } {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) {
      return { x: 0.5, y: 0.5 };
    }
    return { x: clamp01((clientX - rect.left) / rect.width), y: clamp01((clientY - rect.top) / rect.height) };
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>, itemId: string) {
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = normalizedPoint(event.clientX, event.clientY);
    setDrag({ itemId, startX: point.x, startY: point.y, ...point });
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!drag || drag.itemId !== itemIdOf(event)) {
      return;
    }
    setDrag({ ...drag, ...normalizedPoint(event.clientX, event.clientY) });
  }

  function itemIdOf(event: ReactPointerEvent<HTMLDivElement>): string {
    return event.currentTarget.dataset.itemId ?? "";
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (!drag || drag.itemId !== itemIdOf(event)) {
      setDrag(null);
      return;
    }
    const moved = Math.hypot(drag.x - drag.startX, drag.y - drag.startY) >= MIN_DRAG_DISTANCE;
    if (moved) {
      const quadrant = quadrantFromPoint(drag.x, drag.y);
      const highImpact = quadrant === "quick-win" || quadrant === "major-project";
      const lowEffort = quadrant === "quick-win" || quadrant === "fill-in";
      onScoreChange(drag.itemId, highImpact ? HIGH_SCORE : LOW_SCORE, lowEffort ? LOW_SCORE : HIGH_SCORE);
    }
    setDrag(null);
  }

  let unscoredIndex = 0;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-2xs text-ink-muted">{t("methods.impactEffortMatrix.canvasHint")}</p>
      <div
        ref={containerRef}
        data-testid="impact-effort-canvas-grid"
        role="group"
        aria-label={t("methods.impactEffortMatrix.canvasHint")}
        className="relative aspect-square w-full max-w-sm touch-none rounded-control border border-border bg-surface-raised select-none"
      >
        <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-border" />
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-border" />
        <span className="pointer-events-none absolute left-2 top-2 font-medium text-2xs text-ink-muted">
          {t("methods.impactEffortMatrix.quadrants.quick-win")}
        </span>
        <span className="pointer-events-none absolute right-2 top-2 text-right font-medium text-2xs text-ink-muted">
          {t("methods.impactEffortMatrix.quadrants.major-project")}
        </span>
        <span className="pointer-events-none absolute bottom-2 left-2 font-medium text-2xs text-ink-muted">
          {t("methods.impactEffortMatrix.quadrants.fill-in")}
        </span>
        <span className="pointer-events-none absolute right-2 bottom-2 text-right font-medium text-2xs text-ink-muted">
          {t("methods.impactEffortMatrix.quadrants.thankless-task")}
        </span>
        {items.map((item) => {
          const bothScored = scoreValue(item.impact) !== undefined && scoreValue(item.effort) !== undefined;
          const myUnscoredIndex = unscoredIndex;
          if (!bothScored) {
            unscoredIndex += 1;
          }

          const isDragging = drag?.itemId === item.id;
          const position = isDragging ? { x: drag.x, y: drag.y } : positionOf(item, myUnscoredIndex);
          const quadrant = isDragging ? quadrantFromPoint(drag.x, drag.y) : quadrantOf(item);
          const description = item.description.trim() || t("methods.impactEffortMatrix.untitledItem");
          const statusLabel = quadrant
            ? t(`methods.impactEffortMatrix.quadrants.${quadrant}`)
            : t("methods.impactEffortMatrix.unscored");

          return (
            // `aria-hidden`: this dot is a mouse-only drag target duplicating
            // information the row below already exposes through a real,
            // keyboard-operable numeric input plus its own status text —
            // giving it `role="button"` would promise Tab/Enter activation
            // it can't actually deliver (dragging inherently needs a
            // pointer), the same "don't fake operability" reasoning behind
            // `EntryAnnotationEditor`'s own drawn shapes staying
            // non-interactive while a *separate* real control (there, a
            // list of remove buttons; here, the numeric inputs) does the
            // keyboard-accessible work.
            <div
              key={item.id}
              data-item-id={item.id}
              aria-hidden="true"
              title={`${description} — ${statusLabel}`}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 cursor-grab items-center gap-1.5 rounded-full border border-border bg-surface px-2 py-1 text-2xs shadow-sm active:cursor-grabbing"
              style={{ left: `${position.x * 100}%`, top: `${position.y * 100}%` }}
              onPointerDown={(event) => handlePointerDown(event, item.id)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={() => setDrag(null)}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: quadrant ? QUADRANT_COLORS[quadrant] : "#8A8A8A" }}
              />
              <span className="max-w-28 truncate">{description}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
