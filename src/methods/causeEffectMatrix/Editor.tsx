import { useTranslation } from "react-i18next";
import { Button, Input, Label } from "../../ui";
import type { MethodEditorProps } from "../types";
import { weightedTotal } from "./score";
import type { CauseEffectInput, CauseEffectMatrixPayload, CauseEffectOutput } from "./schema";

/**
 * A grid, not a `RowTableEditor` (D-115): the columns *are* user data here —
 * one column per output the user defines — which is exactly the shape the
 * shared substrate's caller-configured-columns contract cannot express.
 */
export function CauseEffectMatrixEditor({ payload, onChange }: MethodEditorProps<CauseEffectMatrixPayload>) {
  const { t } = useTranslation();

  function updateOutput(next: CauseEffectOutput) {
    onChange({ ...payload, outputs: payload.outputs.map((output) => (output.id === next.id ? next : output)) });
  }

  function addOutput() {
    onChange({ ...payload, outputs: [...payload.outputs, { id: crypto.randomUUID(), name: "", weight: "" }] });
  }

  function removeOutput(outputId: string) {
    onChange({ ...payload, outputs: payload.outputs.filter((output) => output.id !== outputId) });
  }

  function updateInput(next: CauseEffectInput) {
    onChange({ ...payload, inputs: payload.inputs.map((input) => (input.id === next.id ? next : input)) });
  }

  function addInput() {
    onChange({ ...payload, inputs: [...payload.inputs, { id: crypto.randomUUID(), name: "", scores: {} }] });
  }

  function removeInput(inputId: string) {
    onChange({ ...payload, inputs: payload.inputs.filter((input) => input.id !== inputId) });
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-3">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-ink-muted">
          {t("methods.causeEffectMatrix.outputsHeading")}
        </h3>
        {payload.outputs.map((output) => (
          <div key={output.id} className="grid grid-cols-[2fr_1fr_auto] items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`cem-output-${output.id}-name`}>{t("methods.causeEffectMatrix.outputName")}</Label>
              <Input
                id={`cem-output-${output.id}-name`}
                value={output.name}
                onChange={(event) => updateOutput({ ...output, name: event.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`cem-output-${output.id}-weight`}>{t("methods.causeEffectMatrix.outputWeight")}</Label>
              <Input
                id={`cem-output-${output.id}-weight`}
                inputMode="numeric"
                value={output.weight}
                onChange={(event) => updateOutput({ ...output, weight: event.target.value })}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeOutput(output.id)}
              aria-label={t("methods.causeEffectMatrix.removeOutput", { name: output.name })}
            >
              ✕
            </Button>
          </div>
        ))}
        <Button type="button" variant="secondary" size="sm" onClick={addOutput}>
          {t("methods.causeEffectMatrix.addOutput")}
        </Button>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-ink-muted">
          {t("methods.causeEffectMatrix.inputsHeading")}
        </h3>
        {payload.inputs.map((input) => (
          <div key={input.id} className="flex flex-col gap-2 rounded-control border border-border p-3">
            <div className="flex items-end gap-3">
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor={`cem-input-${input.id}-name`}>{t("methods.causeEffectMatrix.inputName")}</Label>
                <Input
                  id={`cem-input-${input.id}-name`}
                  value={input.name}
                  onChange={(event) => updateInput({ ...input, name: event.target.value })}
                />
              </div>
              <span className="font-mono text-2xs text-ink-muted">
                {t("methods.causeEffectMatrix.total", { total: weightedTotal(input, payload.outputs) })}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeInput(input.id)}
                aria-label={t("methods.causeEffectMatrix.removeInput", { name: input.name })}
              >
                ✕
              </Button>
            </div>
            {payload.outputs.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {payload.outputs.map((output) => (
                  <div key={output.id} className="flex flex-col gap-1.5">
                    <Label htmlFor={`cem-score-${input.id}-${output.id}`}>
                      {output.name.trim().length > 0 ? output.name : t("methods.causeEffectMatrix.unnamedOutput")}
                    </Label>
                    <Input
                      id={`cem-score-${input.id}-${output.id}`}
                      inputMode="numeric"
                      value={input.scores[output.id] ?? ""}
                      onChange={(event) =>
                        updateInput({ ...input, scores: { ...input.scores, [output.id]: event.target.value } })
                      }
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        <Button type="button" variant="secondary" size="sm" onClick={addInput}>
          {t("methods.causeEffectMatrix.addInput")}
        </Button>
      </section>
    </div>
  );
}
