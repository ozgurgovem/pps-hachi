import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { selectCanRedo, selectCanUndo, useProjectStore } from "../../../state";
import { Button } from "../../../ui";
import { ProjectToolsBar } from "./ProjectToolsBar";
import { SaveIndicator } from "./SaveIndicator";
import type { DescriptorResult } from "./useA3PreviewSync";

export interface WorkspaceTopBarProps {
  /** W3: built once in `WorkspaceShell`, threaded to `ProjectToolsBar` — see `useA3PreviewSync`'s own doc comment. */
  readonly descriptorResult: DescriptorResult;
}

export function WorkspaceTopBar({ descriptorResult }: WorkspaceTopBarProps) {
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
        <ProjectToolsBar descriptorResult={descriptorResult} />
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

/**
 * D-250 (Barış's own real-use report): the original icon here was a circle
 * with eight straight radiating lines and no teeth — structurally a sun
 * glyph, not a gear, which is exactly why it read as a theme/lighting
 * control rather than Settings. Replaced with a real cog shape (rounded
 * teeth around the rim, not straight rays) so it reads as Settings at a
 * glance — the path is Feather Icons' own `settings` glyph (MIT-licensed,
 * the same real, widely-recognized "gear" shape this project's own D-48
 * license-clean posture already applies to fonts), used at its native
 * 24×24 viewBox rather than hand-derived, since a hand-rolled tooth shape
 * risks looking wrong at this icon's small size.
 */
function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
