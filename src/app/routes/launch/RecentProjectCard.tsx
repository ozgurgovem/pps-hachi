import { useTranslation } from "react-i18next";
import { STEP_IDS } from "../../../domain/model";
import { StepTick, cn } from "../../../ui";
import type { RecentEntryMeta } from "./recentEntry";

interface RecentProjectCardProps {
  entry: RecentEntryMeta;
  onOpen: (path: string) => void;
  disabled?: boolean;
}

/**
 * D10 (Anayasa): date formatting is keyed to the app's own selected
 * language (`i18n.language`), never the system locale — the two can differ.
 */
export function RecentProjectCard({ entry, onOpen, disabled }: RecentProjectCardProps) {
  const { t, i18n } = useTranslation();
  const lastModified = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(entry.lastModified));
  const metaLine = [entry.customer, entry.owner].filter(Boolean).join(" · ");

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onOpen(entry.path)}
      className={cn(
        "flex w-full items-center gap-4 rounded-control border border-border bg-surface-raised p-3 text-left",
        "transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        "disabled:pointer-events-none disabled:opacity-50",
      )}
    >
      {/* Placeholder — a real A3 thumbnail needs the Phase 4 renderer. */}
      <div
        aria-hidden="true"
        className="flex h-14 w-20 shrink-0 items-center justify-center rounded-instrument border border-line bg-surface font-mono text-2xs text-ink-muted"
      >
        A3
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-body text-base font-medium text-ink">{entry.title}</p>
        <p className="truncate font-mono text-2xs text-ink-muted">{metaLine || "—"}</p>
      </div>
      <StepTick
        total={STEP_IDS.length}
        current={entry.currentStep}
        aria-label={t("launch.recent.stepProgress", { current: entry.currentStep, total: STEP_IDS.length })}
      />
      <p className="w-28 shrink-0 text-right font-mono text-2xs text-ink-muted">{lastModified}</p>
    </button>
  );
}
