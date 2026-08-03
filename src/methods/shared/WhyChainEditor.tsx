import { useTranslation } from "react-i18next";
import { Button, Input, Label } from "../../ui";
import { newWhyStep, type WhyStep } from "./whyChain";

interface WhyChainEditorProps {
  readonly idPrefix: string;
  readonly legLabel?: string;
  /** Mutable, matching the Zod-inferred `WhyStep[]` field this always round-trips into. */
  readonly steps: WhyStep[];
  readonly onChange: (steps: WhyStep[]) => void;
}

/** Shared by `fiveWhy` and `threeLeggedFiveWhy` (three parallel chains) — see `whyChain.ts`. */
export function WhyChainEditor({ idPrefix, legLabel, steps, onChange }: WhyChainEditorProps) {
  const { t } = useTranslation();

  function updateStep(id: string, answer: string) {
    onChange(steps.map((step) => (step.id === id ? { ...step, answer } : step)));
  }

  function addStep() {
    onChange([...steps, newWhyStep()]);
  }

  function removeStep(id: string) {
    onChange(steps.filter((step) => step.id !== id));
  }

  return (
    <div className="flex flex-col gap-2">
      {legLabel && <span className="font-body text-xs font-medium text-ink-muted">{legLabel}</span>}
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-end gap-2">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor={`${idPrefix}-${step.id}`}>{t("methods.whyChain.whyLabel", { count: index + 1 })}</Label>
            <Input
              id={`${idPrefix}-${step.id}`}
              value={step.answer}
              onChange={(e) => updateStep(step.id, e.target.value)}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => removeStep(step.id)}
            aria-label={t("methods.whyChain.removeWhy")}
          >
            ✕
          </Button>
        </div>
      ))}
      <Button type="button" variant="secondary" size="sm" onClick={addStep}>
        {t("methods.whyChain.addWhy")}
      </Button>
    </div>
  );
}
