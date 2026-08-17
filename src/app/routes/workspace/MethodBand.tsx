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

interface MethodCardProps {
  plugin: ErasedMethodPlugin;
  readOnly: boolean;
  onAdd: (plugin: ErasedMethodPlugin) => void;
}

function MethodCard({ plugin, readOnly, onAdd }: MethodCardProps) {
  const { t } = useTranslation();
  return (
    <div className="flex w-64 flex-col gap-2 rounded-control border border-border bg-surface-raised p-3">
      <span className="font-body text-sm font-medium text-ink">{t(plugin.nameKey)}</span>
      <p className="font-body text-xs text-ink-muted">{t(plugin.useWhenKey)}</p>
      <Button size="sm" onClick={() => onAdd(plugin)} disabled={readOnly}>
        {t("workspace.methodBand.addEntry")}
      </Button>
    </div>
  );
}

/**
 * D-169: `getMethodsForStep`'in sırası korunur, yalnızca render iki bölüme
 * ayrılır — "Önerilen" varsayılan görünür, "Diğer yöntemler" varsayılan
 * daraltılmış bir disclosure (D-133'ün pop-out zoom kontrolleri gibi yerel
 * `useState<boolean>`, yeni bir bağımlılık yok). "Diğer yöntemler" listesi
 * boşsa (§2.3) toggle hiç render edilmez.
 */
export function MethodBand({ stepId }: MethodBandProps) {
  const { t } = useTranslation();
  const readOnly = useProjectStore((s) => s.readOnly);
  const [activePlugin, setActivePlugin] = useState<ErasedMethodPlugin | null>(null);
  const [otherExpanded, setOtherExpanded] = useState(false);
  const methods = getMethodsForStep(stepId);
  const recommended = methods.filter((plugin) => plugin.tier === "recommended");
  const other = methods.filter((plugin) => plugin.tier !== "recommended");

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-ink-muted">
        {t("workspace.methodBand.title")}
      </h2>
      <div className="flex flex-wrap gap-3">
        {recommended.map((plugin) => (
          <MethodCard key={plugin.id} plugin={plugin} readOnly={readOnly} onAdd={setActivePlugin} />
        ))}
      </div>

      {other.length > 0 && (
        <div className="flex flex-col gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="self-start"
            onClick={() => setOtherExpanded((expanded) => !expanded)}
            aria-expanded={otherExpanded}
          >
            {otherExpanded
              ? t("workspace.methodBand.otherMethods.hide")
              : t("workspace.methodBand.otherMethods.show", { count: other.length })}
          </Button>
          {otherExpanded && (
            <div className="flex flex-wrap gap-3">
              {other.map((plugin) => (
                <MethodCard key={plugin.id} plugin={plugin} readOnly={readOnly} onAdd={setActivePlugin} />
              ))}
            </div>
          )}
        </div>
      )}

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
