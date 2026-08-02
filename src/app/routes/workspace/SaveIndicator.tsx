import { useTranslation } from "react-i18next";
import { useProjectStore } from "../../../state";

function formatTime(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

/** D-73: four save states plus read-only — never claims "saved" for a write that didn't happen. */
export function SaveIndicator() {
  const { t, i18n } = useTranslation();
  const readOnly = useProjectStore((s) => s.readOnly);
  const saveStatus = useProjectStore((s) => s.saveStatus);

  if (readOnly || saveStatus.kind === "read-only") {
    return <span className="font-mono text-2xs text-ink-muted">{t("workspace.readOnlyIndicator")}</span>;
  }

  switch (saveStatus.kind) {
    case "saved":
      return (
        <span className="font-mono text-2xs text-ink-muted">
          {t("workspace.savedIndicator", { time: formatTime(saveStatus.at, i18n.language) })}
        </span>
      );
    case "saving":
      return <span className="font-mono text-2xs text-ink-muted">{t("workspace.savingIndicator")}</span>;
    case "conflict":
      return (
        <span role="alert" className="font-mono text-2xs text-danger">
          {t("workspace.conflictIndicator")}
        </span>
      );
    case "error":
      return (
        <span role="alert" className="font-mono text-2xs text-danger">
          {t("workspace.errorIndicator", { reason: saveStatus.reason })}
        </span>
      );
    case "unsaved":
    default:
      return <span className="font-mono text-2xs text-ink-muted">{t("workspace.unsavedIndicator")}</span>;
  }
}
