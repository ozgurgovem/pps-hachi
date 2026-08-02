import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { selectCanRedo, selectCanUndo, useProjectStore } from "../../../state";
import { Button } from "../../../ui";
import { SaveIndicator } from "./SaveIndicator";

export function WorkspaceTopBar() {
  const { t } = useTranslation();
  const title = useProjectStore((s) => s.project?.meta.title);
  const canUndo = useProjectStore(selectCanUndo);
  const canRedo = useProjectStore(selectCanRedo);
  const undo = useProjectStore((s) => s.undo);
  const redo = useProjectStore((s) => s.redo);

  return (
    <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border bg-surface px-4 py-2">
      <div className="flex items-center gap-4">
        <Link to="/" className="font-mono text-2xs uppercase tracking-wide text-ink-muted hover:text-ink">
          ← {t("workspace.backToLaunch")}
        </Link>
        <h1 className="font-display text-sm font-semibold text-ink">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={undo} disabled={!canUndo}>
          {t("workspace.undo")}
        </Button>
        <Button variant="ghost" size="sm" onClick={redo} disabled={!canRedo}>
          {t("workspace.redo")}
        </Button>
        <SaveIndicator />
      </div>
    </header>
  );
}
