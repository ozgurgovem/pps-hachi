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
        "grid w-full grid-cols-[40px_minmax(0,1fr)_auto_auto] items-center gap-4 border-b border-fp-gray-light",
        "px-2 py-3 text-left transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-fp-teal focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        "disabled:pointer-events-none disabled:opacity-50",
      )}
    >
      {/* Placeholder — a real A3 thumbnail needs the Phase 4 renderer. */}
      <div
        aria-hidden="true"
        className="flex h-10 w-10 shrink-0 items-center justify-center border border-fp-gray-dark bg-surface font-mono text-2xs font-semibold text-fp-gray-dark"
      >
        A3
      </div>
      <div className="min-w-0">
        <p className="truncate font-body text-base font-semibold text-fp-charcoal">{entry.title}</p>
        <p className="truncate font-mono text-2xs text-fp-gray-dark">{metaLine || "—"}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <StepTick
          total={STEP_IDS.length}
          current={entry.currentStep}
          aria-label={t("launch.recent.stepProgress", { current: entry.currentStep, total: STEP_IDS.length })}
        />
        <span className="font-mono text-2xs tabular-nums text-fp-gray-dark">
          {entry.currentStep}/{STEP_IDS.length}
        </span>
      </div>
      <p className="w-28 shrink-0 text-right font-mono text-2xs tabular-nums text-fp-gray-dark">{lastModified}</p>
    </button>
  );
}
