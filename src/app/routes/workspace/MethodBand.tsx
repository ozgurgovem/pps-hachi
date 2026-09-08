import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { StepId } from "../../../domain/model";
import { getMethodsForStep, type ErasedMethodPlugin } from "../../../methods";
import { useProjectStore } from "../../../state";
import { Button, cn } from "../../../ui";
import type { ActiveEditor } from "./activeEditor";
import { EntryEditorPanel } from "./EntryEditorPanel";

interface MethodBandProps {
  stepId: StepId;
  activeEditor: ActiveEditor | null;
  onStartCreate: (plugin: ErasedMethodPlugin) => void;
  onCloseEditor: () => void;
}

interface MethodCardProps {
  plugin: ErasedMethodPlugin;
  readOnly: boolean;
  isActive: boolean;
  onAdd: (plugin: ErasedMethodPlugin) => void;
}

function MethodCard({ plugin, readOnly, isActive, onAdd }: MethodCardProps) {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        "flex w-64 flex-col gap-2 rounded-control border bg-surface-raised p-3",
        isActive ? "border-2 border-accent p-[11px]" : "border-border",
      )}
    >
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
 *
 * W2/D-217 §2.1: a card's own "Giriş ekle" no longer opens a modal —
 * `StepPage` owns the one `ActiveEditor` slot; a click here just asks the
 * parent to claim it (`onStartCreate`), and the inline `EntryEditorPanel`
 * renders directly below the card grid when this band is the one holding it.
 */
export function MethodBand({ stepId, activeEditor, onStartCreate, onCloseEditor }: MethodBandProps) {
  const { t } = useTranslation();
  const readOnly = useProjectStore((s) => s.readOnly);
  const [otherExpanded, setOtherExpanded] = useState(false);
  const methods = getMethodsForStep(stepId);
  const recommended = methods.filter((plugin) => plugin.tier === "recommended");
  const other = methods.filter((plugin) => plugin.tier !== "recommended");
  const activePlugin = activeEditor?.kind === "create" ? activeEditor.plugin : null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-ink-muted">
        {t("workspace.methodBand.title")}
      </h2>
      <div className="flex flex-wrap gap-3">
        {recommended.map((plugin) => (
          <MethodCard
            key={plugin.id}
            plugin={plugin}
            readOnly={readOnly}
            isActive={activePlugin?.id === plugin.id}
            onAdd={onStartCreate}
          />
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
                <MethodCard
                  key={plugin.id}
                  plugin={plugin}
                  readOnly={readOnly}
                  isActive={activePlugin?.id === plugin.id}
                  onAdd={onStartCreate}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activePlugin && (
        <EntryEditorPanel stepId={stepId} plugin={activePlugin} mode={{ kind: "create" }} onClose={onCloseEditor} />
      )}
    </section>
  );
}
