import { useTranslation } from "react-i18next";
import { FieldFormEditor } from "../shared/FieldFormEditor";
import type { MethodEditorProps } from "../types";
import { COUNTERMEASURE_FIELDS, type CountermeasureFieldKey } from "./fields";
import { priorityScoreOf } from "./priorityScore";
import type { CountermeasurePayload } from "./schema";

export function CountermeasureEditor({ payload, onChange }: MethodEditorProps<CountermeasurePayload>) {
  const { t } = useTranslation();
  const score = priorityScoreOf(payload);

  return (
    <div className="flex flex-col gap-3">
      <FieldFormEditor<CountermeasureFieldKey>
        idPrefix="countermeasure"
        fields={COUNTERMEASURE_FIELDS}
        values={payload}
        onChange={(values) => onChange({ ...payload, ...values })}
      />
      <p className="font-mono text-2xs text-ink-muted">
        {score === undefined
          ? t("methods.countermeasure.priorityScoreUnscored")
          : t("methods.countermeasure.priorityScore", { score })}
      </p>
    </div>
  );
}
