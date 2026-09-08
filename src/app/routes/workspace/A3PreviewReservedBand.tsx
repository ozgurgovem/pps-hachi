import { useTranslation } from "react-i18next";
import { Button } from "../../../ui";
import { openOrFocusA3PreviewWindow } from "../a3PreviewWindow/window";

/**
 * W2/D-217 §2.3/§2.5: reserves the space for W3's own live, cropped-to-this-
 * step preview — that renderer isn't built yet, this band only carries the
 * "open the full A3 instead" escape hatch, reusing the exact same mechanism
 * `StepOverview`'s own button already calls (D-133's pop-out window, zoom/
 * pan/pin editing included) rather than inventing a second entry point.
 * Same i18n key as that button (`workspace.stepOverview.openA3Preview`) —
 * one control, one name, wherever it appears (CLAUDE.md's own copy rule).
 */
export function A3PreviewReservedBand() {
  const { t } = useTranslation();
  return (
    <section className="flex flex-col gap-3 rounded-control border border-border bg-surface-raised p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-ink-muted">
          {t("workspace.stepPreview.title")}
        </h2>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-dashed border-accent px-2.5 py-0.5 font-mono text-2xs uppercase tracking-wide text-accent">
            {t("workspace.stepPreview.comingSoonBadge")}
          </span>
          <Button variant="secondary" size="sm" onClick={() => void openOrFocusA3PreviewWindow()}>
            {t("workspace.stepOverview.openA3Preview")}
          </Button>
        </div>
      </div>
      <p className="font-body text-sm text-ink-muted">{t("workspace.stepPreview.comingSoonBody")}</p>
    </section>
  );
}
