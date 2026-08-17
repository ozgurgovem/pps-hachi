import { useTranslation } from "react-i18next";
import { Button, Input, Label, SelectContent, SelectItem, SelectRoot, SelectTrigger, SelectValue } from "../../ui";
import type { MethodEditorProps } from "../types";
import { KPI_STRIP_STATUSES, type KpiStripItem, type KpiStripPayload } from "./schema";

function newItemId(): string {
  return crypto.randomUUID();
}

function emptyItem(): KpiStripItem {
  return {
    id: newItemId(),
    label: "",
    unit: "",
    baseline: 0,
    target: 0,
    actual: 0,
    sustain: undefined,
    result: undefined,
    status: "inProgress",
  };
}

/** Blank clears an optional numeric field back to `undefined` rather than coercing it to `0` — see P-36. */
function parseOptionalNumber(raw: string): number | undefined {
  return raw.trim() === "" ? undefined : Number(raw);
}

export function KpiStripEditor({ payload, onChange }: MethodEditorProps<KpiStripPayload>) {
  const { t } = useTranslation();

  function updateItem(id: string, patch: Partial<KpiStripItem>) {
    onChange({ ...payload, items: payload.items.map((item) => (item.id === id ? { ...item, ...patch } : item)) });
  }

  function addItem() {
    onChange({ ...payload, items: [...payload.items, emptyItem()] });
  }

  function removeItem(id: string) {
    onChange({ ...payload, items: payload.items.filter((item) => item.id !== id) });
  }

  return (
    <div className="flex flex-col gap-3">
      {payload.items.map((item) => (
        <div key={item.id} className="flex flex-col gap-2 rounded-control border border-border p-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`kpi-strip-label-${item.id}`}>{t("methods.kpiStrip.fields.label")}</Label>
              <Input
                id={`kpi-strip-label-${item.id}`}
                value={item.label}
                onChange={(event) => updateItem(item.id, { label: event.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`kpi-strip-unit-${item.id}`}>{t("methods.kpiStrip.fields.unit")}</Label>
              <Input
                id={`kpi-strip-unit-${item.id}`}
                value={item.unit}
                onChange={(event) => updateItem(item.id, { unit: event.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`kpi-strip-baseline-${item.id}`}>{t("methods.kpiStrip.fields.baseline")}</Label>
              <Input
                id={`kpi-strip-baseline-${item.id}`}
                type="number"
                value={item.baseline}
                onChange={(event) => updateItem(item.id, { baseline: Number(event.target.value) })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`kpi-strip-target-${item.id}`}>{t("methods.kpiStrip.fields.target")}</Label>
              <Input
                id={`kpi-strip-target-${item.id}`}
                type="number"
                value={item.target}
                onChange={(event) => updateItem(item.id, { target: Number(event.target.value) })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`kpi-strip-actual-${item.id}`}>{t("methods.kpiStrip.fields.actual")}</Label>
              <Input
                id={`kpi-strip-actual-${item.id}`}
                type="number"
                value={item.actual}
                onChange={(event) => updateItem(item.id, { actual: Number(event.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`kpi-strip-sustain-${item.id}`}>{t("methods.kpiStrip.fields.sustain")}</Label>
              <Input
                id={`kpi-strip-sustain-${item.id}`}
                type="number"
                value={item.sustain ?? ""}
                onChange={(event) => updateItem(item.id, { sustain: parseOptionalNumber(event.target.value) })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`kpi-strip-result-${item.id}`}>{t("methods.kpiStrip.fields.result")}</Label>
              <Input
                id={`kpi-strip-result-${item.id}`}
                type="number"
                value={item.result ?? ""}
                onChange={(event) => updateItem(item.id, { result: parseOptionalNumber(event.target.value) })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`kpi-strip-status-${item.id}`}>{t("methods.kpiStrip.fields.status")}</Label>
              <SelectRoot
                value={item.status}
                onValueChange={(next) => updateItem(item.id, { status: next as KpiStripItem["status"] })}
              >
                <SelectTrigger id={`kpi-strip-status-${item.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KPI_STRIP_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {t(`methods.kpiStrip.statuses.${status}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </SelectRoot>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => removeItem(item.id)}
            aria-label={t("methods.kpiStrip.removeItem")}
            className="self-end"
          >
            ✕
          </Button>
        </div>
      ))}

      <Button type="button" variant="secondary" size="sm" onClick={addItem}>
        {t("methods.kpiStrip.addItem")}
      </Button>
    </div>
  );
}
