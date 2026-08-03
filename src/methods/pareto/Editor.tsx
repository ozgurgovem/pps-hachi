import { useTranslation } from "react-i18next";
import { Button, Input, Label } from "../../ui";
import type { MethodEditorProps } from "../types";
import type { ParetoPayload } from "./schema";

function newCategoryId(): string {
  return crypto.randomUUID();
}

export function ParetoEditor({ payload, onChange }: MethodEditorProps<ParetoPayload>) {
  const { t } = useTranslation();

  function updateCategory(id: string, patch: Partial<ParetoPayload["categories"][number]>) {
    onChange({
      ...payload,
      categories: payload.categories.map((category) =>
        category.id === id ? { ...category, ...patch } : category,
      ),
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
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pareto-unit">{t("methods.pareto.unitLabel")}</Label>
        <Input
          id="pareto-unit"
          value={payload.unit}
          onChange={(event) => onChange({ ...payload, unit: event.target.value })}
        />
      </div>

      <div className="flex flex-col gap-2">
        {payload.categories.map((category) => (
          <div key={category.id} className="flex items-end gap-2">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor={`pareto-label-${category.id}`}>{t("methods.pareto.categoryLabel")}</Label>
              <Input
                id={`pareto-label-${category.id}`}
                value={category.label}
                onChange={(event) => updateCategory(category.id, { label: event.target.value })}
              />
            </div>
            <div className="flex w-28 flex-col gap-1.5">
              <Label htmlFor={`pareto-count-${category.id}`}>{t("methods.pareto.countLabel")}</Label>
              <Input
                id={`pareto-count-${category.id}`}
                type="number"
                value={category.count}
                onChange={(event) =>
                  updateCategory(category.id, { count: Number(event.target.value) })
                }
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeCategory(category.id)}
              aria-label={t("methods.pareto.removeCategory")}
            >
              ✕
            </Button>
          </div>
        ))}
      </div>

      <Button type="button" variant="secondary" size="sm" onClick={addCategory}>
        {t("methods.pareto.addCategory")}
      </Button>
    </div>
  );
}
