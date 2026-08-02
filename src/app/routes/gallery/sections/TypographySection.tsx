import { useTranslation } from "react-i18next";

export function TypographySection() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <p className="font-mono text-2xs uppercase tracking-wide text-ink-muted">
          {t("gallery.typography.displayLabel")}
        </p>
        <p className="font-display text-4xl font-bold uppercase tracking-[0.04em] tabular-nums text-ink">
          {t("gallery.typography.displaySample")}
        </p>
        <p className="font-display text-2xl font-semibold uppercase tracking-[0.06em] text-ink">
          {t("gallery.typography.displaySampleStep")}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="font-mono text-2xs uppercase tracking-wide text-ink-muted">
          {t("gallery.typography.bodyLabel")}
        </p>
        <p className="font-body text-lg text-ink">{t("gallery.typography.bodySample")}</p>
        <p className="font-body text-base text-ink-muted">
          {t("gallery.typography.bodySampleMuted")}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="font-mono text-2xs uppercase tracking-wide text-ink-muted">
          {t("gallery.typography.monoLabel")}
        </p>
        <p className="font-mono text-lg tabular-nums text-ink">
          {t("gallery.typography.monoSample")}
        </p>
        <p className="font-mono text-sm tabular-nums text-ink-muted">
          {t("gallery.typography.monoSampleMuted")}
        </p>
      </div>
    </div>
  );
}
