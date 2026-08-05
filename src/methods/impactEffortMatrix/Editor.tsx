import { useTranslation } from "react-i18next";
import { Button, Input, Label } from "../../ui";
import type { MethodEditorProps } from "../types";
import { quadrantOf } from "./quadrant";
import type { ImpactEffortItem, ImpactEffortMatrixPayload } from "./schema";

/** A grid whose two axes are user-scored, computed quadrant shown live — same shape as `causeEffectMatrix/Editor.tsx`. */
export function ImpactEffortMatrixEditor({ payload, onChange }: MethodEditorProps<ImpactEffortMatrixPayload>) {
  const { t } = useTranslation();

  function updateItem(next: ImpactEffortItem) {
    onChange({ items: payload.items.map((item) => (item.id === next.id ? next : item)) });
  }

  function addItem() {
    onChange({ items: [...payload.items, { id: crypto.randomUUID(), description: "", impact: "", effort: "" }] });
  }

  function removeItem(itemId: string) {
    onChange({ items: payload.items.filter((item) => item.id !== itemId) });
  }

  return (
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
            <span className="font-mono text-2xs text-ink-muted">
              {quadrant ? t(`methods.impactEffortMatrix.quadrants.${quadrant}`) : t("methods.impactEffortMatrix.unscored")}
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
  );
}

