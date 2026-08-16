import { useTranslation } from "react-i18next";
import { Button, Input, Label } from "../../ui";
import { FieldFormEditor } from "../shared/FieldFormEditor";
import type { MethodEditorProps } from "../types";
import { PROBLEM_IMPACT_FIELDS, type ProblemImpactFieldKey } from "./fields";
import type { ProblemImpactPayload } from "./schema";

function newCategoryId(): string {
  return crypto.randomUUID();
}

/**
 * The category list half mirrors `pareto/Editor.tsx` inline rather than
 * sharing a component with it — this is `problem-impact`'s own independent
 * Pareto data (D-124), and D-114's zero-new-mechanism budget for this slice
 * rules out extracting a shared category-list substrate here.
 */
export function ProblemImpactEditor({ payload, onChange }: MethodEditorProps<ProblemImpactPayload>) {
  const { t } = useTranslation();

  function updateCategory(id: string, patch: Partial<ProblemImpactPayload["categories"][number]>) {
    onChange({
      ...payload,
      categories: payload.categories.map((category) => (category.id === id ? { ...category, ...patch } : category)),
    });
  }

  function addCategory() {
    onChange({
      ...payload,
      categories: [...payload.categories, { id: newCategoryId(), label: "", count: 0 }],
    });
  }

  function removeCategory(id: string) {
    onChange({ ...payload, categories: payload.categories.filter((category) => category.id !== id) });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="problem-impact-unit">{t("methods.problemImpact.unitLabel")}</Label>
          <Input
            id="problem-impact-unit"
            value={payload.unit}
            onChange={(event) => onChange({ ...payload, unit: event.target.value })}
          />
        </div>

        <div className="flex flex-col gap-2">
          {payload.categories.map((category) => (
            <div key={category.id} className="flex items-end gap-2">
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor={`problem-impact-label-${category.id}`}>
                  {t("methods.problemImpact.categoryLabel")}
                </Label>
                <Input
                  id={`problem-impact-label-${category.id}`}
                  value={category.label}
                  onChange={(event) => updateCategory(category.id, { label: event.target.value })}
                />
              </div>
              <div className="flex w-28 flex-col gap-1.5">
                <Label htmlFor={`problem-impact-count-${category.id}`}>
                  {t("methods.problemImpact.countLabel")}
                </Label>
                <Input
                  id={`problem-impact-count-${category.id}`}
                  type="number"
                  value={category.count}
                  onChange={(event) => updateCategory(category.id, { count: Number(event.target.value) })}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeCategory(category.id)}
                aria-label={t("methods.problemImpact.removeCategory")}
              >
                ✕
              </Button>
            </div>
          ))}
        </div>

        <Button type="button" variant="secondary" size="sm" onClick={addCategory}>
          {t("methods.problemImpact.addCategory")}
        </Button>
      </div>

      <FieldFormEditor<ProblemImpactFieldKey>
        idPrefix="problem-impact"
        fields={PROBLEM_IMPACT_FIELDS}
        values={payload}
        onChange={(values) => onChange({ ...payload, ...values })}
      />
    </div>
  );
}
