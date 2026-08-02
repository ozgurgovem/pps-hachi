import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { StepId } from "../../../domain/model";
import { getMethodsForStep, type ErasedMethodPlugin } from "../../../methods";
import { useProjectStore } from "../../../state";
import { Button } from "../../../ui";
import { EntryEditorDialog } from "./EntryEditorDialog";

interface MethodBandProps {
  stepId: StepId;
}

export function MethodBand({ stepId }: MethodBandProps) {
  const { t } = useTranslation();
  const readOnly = useProjectStore((s) => s.readOnly);
  const [activePlugin, setActivePlugin] = useState<ErasedMethodPlugin | null>(null);
  const methods = getMethodsForStep(stepId);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-ink-muted">
        {t("workspace.methodBand.title")}
      </h2>
      <div className="flex flex-wrap gap-3">
        {methods.map((plugin) => (
          <div
            key={plugin.id}
            className="flex w-64 flex-col gap-2 rounded-control border border-border bg-surface-raised p-3"
          >
            <span className="font-body text-sm font-medium text-ink">{t(plugin.nameKey)}</span>
            <p className="font-body text-xs text-ink-muted">{t(plugin.useWhenKey)}</p>
            <Button size="sm" onClick={() => setActivePlugin(plugin)} disabled={readOnly}>
              {t("workspace.methodBand.addEntry")}
            </Button>
          </div>
        ))}
      </div>

      {activePlugin && (
        <EntryEditorDialog
          stepId={stepId}
          plugin={activePlugin}
          mode={{ kind: "create" }}
          open
          onOpenChange={(open) => {
            if (!open) setActivePlugin(null);
          }}
        />
      )}
    </section>
  );
}
