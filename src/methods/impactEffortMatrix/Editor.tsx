import { useTranslation } from "react-i18next";
import { Button, Input, Label } from "../../ui";
import type { MethodEditorProps } from "../types";
import { ImpactEffortCanvas } from "./ImpactEffortCanvas";
import { quadrantOf } from "./quadrant";
import type { ImpactEffortItem, ImpactEffortMatrixPayload } from "./schema";

/**
 * A grid whose two axes are user-scored, computed quadrant shown live — same
 * shape as `causeEffectMatrix/Editor.tsx` — plus (P-27) a free-position
 * drag canvas over the same two scores. The canvas and the numeric inputs
 * below stay in two-way sync (Barış's own choice, `docs/oturumlar/
 * P27-impact-effort-drag-drop.md` §1 question 3): dragging a dot writes the
 * same `impact`/`effort` fields these inputs edit, and typing a score moves
 * the matching dot on the next render.
 */
export function ImpactEffortMatrixEditor({ payload, onChange }: MethodEditorProps<ImpactEffortMatrixPayload>) {
  const { t } = useTranslation();

  function updateItem(next: ImpactEffortItem) {
    onChange({ items: payload.items.map((item) => (item.id === next.id ? next : item)) });
  }

  function updateScore(itemId: string, impact: string, effort: string) {
    onChange({ items: payload.items.map((item) => (item.id === itemId ? { ...item, impact, effort } : item)) });
  }

  function addItem() {
    onChange({ items: [...payload.items, { id: crypto.randomUUID(), description: "", impact: "", effort: "" }] });
  }

  function removeItem(itemId: string) {
    onChange({ items: payload.items.filter((item) => item.id !== itemId) });
  }

  return (
    <div className="flex flex-col gap-4">
      {payload.items.length > 0 && <ImpactEffortCanvas items={payload.items} onScoreChange={updateScore} />}
      <div className="flex flex-col gap-3">
        {payload.items.map((item) => {
          const quadrant = quadrantOf(item);
          return (
            <div key={item.id} className="grid grid-cols-[2fr_1fr_1fr_auto_auto] items-end gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`iem-desc-${item.id}`}>{t("methods.impactEffortMatrix.descriptionLabel")}</Label>
                <Input
                  id={`iem-desc-${item.id}`}
                  value={item.description}
                  onChange={(event) => updateItem({ ...item, description: event.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`iem-impact-${item.id}`}>{t("methods.impactEffortMatrix.impactLabel")}</Label>
                <Input
                  id={`iem-impact-${item.id}`}
                  inputMode="numeric"
                  value={item.impact}
                  onChange={(event) => updateItem({ ...item, impact: event.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`iem-effort-${item.id}`}>{t("methods.impactEffortMatrix.effortLabel")}</Label>
                <Input
                  id={`iem-effort-${item.id}`}
                  inputMode="numeric"
                  value={item.effort}
                  onChange={(event) => updateItem({ ...item, effort: event.target.value })}
                />
              </div>
              {/* P-27: `data-testid` here is a deliberate test-scoping escape hatch — the canvas above renders the same quadrant strings as corner labels, so a plain `getByText` would match both (the same ambiguity D-232/P-42 already fixed once by scoping a query, not by changing the shared wording). */}
              <span data-testid={`item-quadrant-${item.id}`} className="font-mono text-2xs text-ink-muted">
                {quadrant
                  ? t(`methods.impactEffortMatrix.quadrants.${quadrant}`)
                  : t("methods.impactEffortMatrix.unscored")}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeItem(item.id)}
                aria-label={t("methods.impactEffortMatrix.removeItem", { description: item.description })}
              >
                ✕
              </Button>
            </div>
          );
        })}
        <Button type="button" variant="secondary" size="sm" onClick={addItem}>
          {t("methods.impactEffortMatrix.addItem")}
        </Button>
      </div>
    </div>
  );
}

