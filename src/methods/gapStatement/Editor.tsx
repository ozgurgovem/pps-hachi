import { useTranslation } from "react-i18next";
import { Input, Label, Textarea } from "../../ui";
import type { MethodEditorProps } from "../types";
import type { GapStatementPayload } from "./schema";

const FIELD_KEYS = ["ideal", "actual", "gap"] as const satisfies readonly (keyof GapStatementPayload)[];

/** D-196/§1.2 S1: the gap's quantification — a number, a unit, and a baseline period — beside the three free-text fields above. */
export function GapStatementEditor({ payload, onChange }: MethodEditorProps<GapStatementPayload>) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3">
      {FIELD_KEYS.map((key) => (
        <div key={key} className="flex flex-col gap-1.5">
          <Label htmlFor={`gap-statement-${key}`}>{t(`methods.gapStatement.${key}Label`)}</Label>
          <Textarea
            id={`gap-statement-${key}`}
            value={payload[key]}
            onChange={(event) => onChange({ ...payload, [key]: event.target.value })}
            rows={2}
          />
        </div>
      ))}

      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="gap-statement-gapValue">{t("methods.gapStatement.gapValueLabel")}</Label>
          <Input
            id="gap-statement-gapValue"
            type="number"
            value={payload.gapValue}
            onChange={(event) => onChange({ ...payload, gapValue: Number(event.target.value) })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="gap-statement-unit">{t("methods.gapStatement.unitLabel")}</Label>
          <Input
            id="gap-statement-unit"
            value={payload.unit}
            onChange={(event) => onChange({ ...payload, unit: event.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="gap-statement-baselinePeriod">{t("methods.gapStatement.baselinePeriodLabel")}</Label>
          <Input
            id="gap-statement-baselinePeriod"
            value={payload.baselinePeriod}
            onChange={(event) => onChange({ ...payload, baselinePeriod: event.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="gap-statement-actualValue">{t("methods.gapStatement.actualValueLabel")}</Label>
          <Input
            id="gap-statement-actualValue"
            type="number"
            value={payload.actualValue}
            onChange={(event) => onChange({ ...payload, actualValue: Number(event.target.value) })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="gap-statement-idealValue">{t("methods.gapStatement.idealValueLabel")}</Label>
          <Input
            id="gap-statement-idealValue"
            type="number"
            value={payload.idealValue}
            onChange={(event) => onChange({ ...payload, idealValue: Number(event.target.value) })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="gap-statement-targetDate">{t("methods.gapStatement.targetDateLabel")}</Label>
          <Input
            id="gap-statement-targetDate"
            value={payload.targetDate}
            onChange={(event) => onChange({ ...payload, targetDate: event.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
