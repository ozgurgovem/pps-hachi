import { useTranslation } from "react-i18next";
import { Button, Input, Label, Textarea } from "../../ui";
import type { MethodEditorProps } from "../types";
import type { SmartTargetPayload } from "./schema";

function newItemId(): string {
  return crypto.randomUUID();
}

export function SmartTargetEditor({ payload, onChange }: MethodEditorProps<SmartTargetPayload>) {
  const { t } = useTranslation();

  function addItem() {
    onChange({
      ...payload,
      prioritizedItems: [...payload.prioritizedItems, { id: newItemId(), text: "" }],
    });
  }

  function updateItem(id: string, text: string) {
    onChange({
      ...payload,
      prioritizedItems: payload.prioritizedItems.map((item) => (item.id === id ? { ...item, text } : item)),
    });
  }

  function removeItem(id: string) {
    onChange({ ...payload, prioritizedItems: payload.prioritizedItems.filter((item) => item.id !== id) });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="smart-metric">{t("methods.smartTarget.metricLabel")}</Label>
          <Input id="smart-metric" value={payload.metric} onChange={(e) => onChange({ ...payload, metric: e.target.value })} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="smart-unit">{t("methods.smartTarget.unitLabel")}</Label>
          <Input id="smart-unit" value={payload.unit} onChange={(e) => onChange({ ...payload, unit: e.target.value })} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="smart-owner">{t("methods.smartTarget.ownerLabel")}</Label>
          <Input id="smart-owner" value={payload.owner} onChange={(e) => onChange({ ...payload, owner: e.target.value })} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="smart-baseline">{t("methods.smartTarget.baselineLabel")}</Label>
          <Input
            id="smart-baseline"
            type="number"
            value={payload.baseline}
            onChange={(e) => onChange({ ...payload, baseline: Number(e.target.value) })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="smart-target">{t("methods.smartTarget.targetLabel")}</Label>
          <Input
            id="smart-target"
            type="number"
            value={payload.target}
            onChange={(e) => onChange({ ...payload, target: Number(e.target.value) })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="smart-due-date">{t("methods.smartTarget.dueDateLabel")}</Label>
          <Input
            id="smart-due-date"
            type="date"
            value={payload.dueDate}
            onChange={(e) => onChange({ ...payload, dueDate: e.target.value })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="font-body text-xs font-medium text-ink-muted">
          {t("methods.smartTarget.prioritizedItemsLabel")}
        </span>
        {payload.prioritizedItems.map((item) => (
          <div key={item.id} className="flex items-center gap-2">
            <Input
              aria-label={t("methods.smartTarget.prioritizedItemLabel")}
              value={item.text}
              onChange={(e) => updateItem(item.id, e.target.value)}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeItem(item.id)}
              aria-label={t("methods.smartTarget.removeItem")}
            >
              ✕
            </Button>
          </div>
        ))}
        <Button type="button" variant="secondary" size="sm" onClick={addItem}>
          {t("methods.smartTarget.addItem")}
        </Button>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="smart-stakeholder-note">{t("methods.smartTarget.stakeholderNoteLabel")}</Label>
        <Textarea
          id="smart-stakeholder-note"
          value={payload.stakeholderNote}
          onChange={(e) => onChange({ ...payload, stakeholderNote: e.target.value })}
          rows={3}
        />
      </div>
    </div>
  );
}
