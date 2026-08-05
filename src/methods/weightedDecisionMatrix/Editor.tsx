import { useTranslation } from "react-i18next";
import { Button, Input, Label } from "../../ui";
import type { MethodEditorProps } from "../types";
import { weightedTotal } from "./score";
import type { DecisionCriterion, DecisionOption, WeightedDecisionMatrixPayload } from "./schema";

/** Same shape as `causeEffectMatrix/Editor.tsx` — the columns are user data, which `RowTableEditor` (D-115) cannot express. */
export function WeightedDecisionMatrixEditor({ payload, onChange }: MethodEditorProps<WeightedDecisionMatrixPayload>) {
  const { t } = useTranslation();

  function updateCriterion(next: DecisionCriterion) {
    onChange({ ...payload, criteria: payload.criteria.map((criterion) => (criterion.id === next.id ? next : criterion)) });
  }

  function addCriterion() {
    onChange({ ...payload, criteria: [...payload.criteria, { id: crypto.randomUUID(), name: "", weight: "" }] });
  }

  function removeCriterion(criterionId: string) {
    onChange({ ...payload, criteria: payload.criteria.filter((criterion) => criterion.id !== criterionId) });
  }

  function updateOption(next: DecisionOption) {
    onChange({ ...payload, options: payload.options.map((option) => (option.id === next.id ? next : option)) });
  }

  function addOption() {
    onChange({ ...payload, options: [...payload.options, { id: crypto.randomUUID(), name: "", scores: {} }] });
  }

  function removeOption(optionId: string) {
    onChange({ ...payload, options: payload.options.filter((option) => option.id !== optionId) });
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-3">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-ink-muted">
          {t("methods.weightedDecisionMatrix.criteriaHeading")}
        </h3>
        {payload.criteria.map((criterion) => (
          <div key={criterion.id} className="grid grid-cols-[2fr_1fr_auto] items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`wdm-criterion-${criterion.id}-name`}>{t("methods.weightedDecisionMatrix.criterionName")}</Label>
              <Input
                id={`wdm-criterion-${criterion.id}-name`}
                value={criterion.name}
                onChange={(event) => updateCriterion({ ...criterion, name: event.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`wdm-criterion-${criterion.id}-weight`}>{t("methods.weightedDecisionMatrix.criterionWeight")}</Label>
              <Input
                id={`wdm-criterion-${criterion.id}-weight`}
                inputMode="numeric"
                value={criterion.weight}
                onChange={(event) => updateCriterion({ ...criterion, weight: event.target.value })}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeCriterion(criterion.id)}
              aria-label={t("methods.weightedDecisionMatrix.removeCriterion", { name: criterion.name })}
            >
              ✕
            </Button>
          </div>
        ))}
        <Button type="button" variant="secondary" size="sm" onClick={addCriterion}>
          {t("methods.weightedDecisionMatrix.addCriterion")}
        </Button>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-ink-muted">
          {t("methods.weightedDecisionMatrix.optionsHeading")}
        </h3>
        {payload.options.map((option) => (
          <div key={option.id} className="flex flex-col gap-2 rounded-control border border-border p-3">
            <div className="flex items-end gap-3">
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor={`wdm-option-${option.id}-name`}>{t("methods.weightedDecisionMatrix.optionName")}</Label>
                <Input
                  id={`wdm-option-${option.id}-name`}
                  value={option.name}
                  onChange={(event) => updateOption({ ...option, name: event.target.value })}
                />
              </div>
              <span className="font-mono text-2xs text-ink-muted">
                {t("methods.weightedDecisionMatrix.total", { total: weightedTotal(option, payload.criteria) })}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeOption(option.id)}
                aria-label={t("methods.weightedDecisionMatrix.removeOption", { name: option.name })}
              >
                ✕
              </Button>
            </div>
            {payload.criteria.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {payload.criteria.map((criterion) => (
                  <div key={criterion.id} className="flex flex-col gap-1.5">
                    <Label htmlFor={`wdm-score-${option.id}-${criterion.id}`}>
                      {criterion.name.trim().length > 0 ? criterion.name : t("methods.weightedDecisionMatrix.unnamedCriterion")}
                    </Label>
                    <Input
                      id={`wdm-score-${option.id}-${criterion.id}`}
                      inputMode="numeric"
                      value={option.scores[criterion.id] ?? ""}
                      onChange={(event) =>
                        updateOption({ ...option, scores: { ...option.scores, [criterion.id]: event.target.value } })
                      }
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        <Button type="button" variant="secondary" size="sm" onClick={addOption}>
          {t("methods.weightedDecisionMatrix.addOption")}
        </Button>
      </section>
    </div>
  );
}
