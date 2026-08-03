import { useTranslation } from "react-i18next";
import { Button, Input, Label } from "../../ui";
import type { MethodEditorProps } from "../types";
import type { TrendPayload } from "./schema";

function newId(): string {
  return crypto.randomUUID();
}

export function TrendEditor({ payload, onChange }: MethodEditorProps<TrendPayload>) {
  const { t } = useTranslation();

  function updatePoint(id: string, patch: Partial<TrendPayload["points"][number]>) {
    onChange({
      ...payload,
      points: payload.points.map((point) => (point.id === id ? { ...point, ...patch } : point)),
    });
  }

  function addPoint() {
    onChange({ ...payload, points: [...payload.points, { id: newId(), label: "", value: 0 }] });
  }

  function removePoint(id: string) {
    onChange({ ...payload, points: payload.points.filter((point) => point.id !== id) });
  }

  function addEvent() {
    onChange({ ...payload, events: [...payload.events, { label: "", at: payload.points[0]?.label ?? "" }] });
  }

  function updateEvent(index: number, patch: Partial<TrendPayload["events"][number]>) {
    onChange({
      ...payload,
      events: payload.events.map((event, i) => (i === index ? { ...event, ...patch } : event)),
    });
  }

  function removeEvent(index: number) {
    onChange({ ...payload, events: payload.events.filter((_, i) => i !== index) });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="trend-unit">{t("methods.trend.unitLabel")}</Label>
          <Input id="trend-unit" value={payload.unit} onChange={(e) => onChange({ ...payload, unit: e.target.value })} />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="trend-target-value">{t("methods.trend.targetValueLabel")}</Label>
          <Input
            id="trend-target-value"
            type="number"
            value={payload.targetValue ?? ""}
            onChange={(e) =>
              onChange({ ...payload, targetValue: e.target.value === "" ? undefined : Number(e.target.value) })
            }
          />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="trend-target-label">{t("methods.trend.targetLabelLabel")}</Label>
          <Input
            id="trend-target-label"
            value={payload.targetLabel ?? ""}
            onChange={(e) => onChange({ ...payload, targetLabel: e.target.value })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="font-body text-xs font-medium text-ink-muted">{t("methods.trend.pointsLabel")}</span>
        {payload.points.map((point) => (
          <div key={point.id} className="flex items-end gap-2">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor={`trend-point-label-${point.id}`}>{t("methods.trend.pointLabel")}</Label>
              <Input
                id={`trend-point-label-${point.id}`}
                value={point.label}
                onChange={(e) => updatePoint(point.id, { label: e.target.value })}
              />
            </div>
            <div className="flex w-28 flex-col gap-1.5">
              <Label htmlFor={`trend-point-value-${point.id}`}>{t("methods.trend.pointValueLabel")}</Label>
              <Input
                id={`trend-point-value-${point.id}`}
                type="number"
                value={point.value}
                onChange={(e) => updatePoint(point.id, { value: Number(e.target.value) })}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removePoint(point.id)}
              aria-label={t("methods.trend.removePoint")}
            >
              ✕
            </Button>
          </div>
        ))}
        <Button type="button" variant="secondary" size="sm" onClick={addPoint}>
          {t("methods.trend.addPoint")}
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <span className="font-body text-xs font-medium text-ink-muted">{t("methods.trend.eventsLabel")}</span>
        {payload.events.map((event, index) => (
          <div key={index} className="flex items-end gap-2">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor={`trend-event-label-${index}`}>{t("methods.trend.eventLabelLabel")}</Label>
              <Input
                id={`trend-event-label-${index}`}
                value={event.label}
                onChange={(e) => updateEvent(index, { label: e.target.value })}
              />
            </div>
            <div className="flex w-40 flex-col gap-1.5">
              <Label htmlFor={`trend-event-at-${index}`}>{t("methods.trend.eventAtLabel")}</Label>
              <Input
                id={`trend-event-at-${index}`}
                value={event.at}
                onChange={(e) => updateEvent(index, { at: e.target.value })}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeEvent(index)}
              aria-label={t("methods.trend.removeEvent")}
            >
              ✕
            </Button>
          </div>
        ))}
        <Button type="button" variant="secondary" size="sm" onClick={addEvent}>
          {t("methods.trend.addEvent")}
        </Button>
      </div>
    </div>
  );
}
