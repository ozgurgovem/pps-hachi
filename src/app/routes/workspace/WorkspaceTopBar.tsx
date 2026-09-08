import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { selectCanRedo, selectCanUndo, useProjectStore } from "../../../state";
import { Button } from "../../../ui";
import { ProjectToolsBar } from "./ProjectToolsBar";
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
        <ProjectToolsBar />
        <Button variant="ghost" size="sm" onClick={undo} disabled={!canUndo}>
          {t("workspace.undo")}
        </Button>
        <Button variant="ghost" size="sm" onClick={redo} disabled={!canRedo}>
          {t("workspace.redo")}
        </Button>
        <SaveIndicator />
        <Link
          to="/settings"
          aria-label={t("workspace.settings")}
          className="flex h-8 w-8 items-center justify-center rounded-control text-ink-muted hover:bg-surface-raised hover:text-ink"
        >
          <GearIcon />
        </Link>
      </div>
    </header>
  );
}

function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M8 1.5v1.6M8 12.9v1.6M14.5 8h-1.6M3.1 8H1.5M12.36 3.64l-1.13 1.13M4.77 11.23l-1.13 1.13M12.36 12.36l-1.13-1.13M4.77 4.77 3.64 3.64"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}
