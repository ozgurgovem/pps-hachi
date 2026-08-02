import { useTranslation } from "react-i18next";
import { Badge, StepTick } from "../../../../ui";

export function StatusSection() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-3">
        <Badge status="empty">{t("gallery.status.empty")}</Badge>
        <Badge status="in-progress">{t("gallery.status.inProgress")}</Badge>
        <Badge status="complete">{t("gallery.status.complete")}</Badge>
        <Badge status="flagged">{t("gallery.status.flagged")}</Badge>
      </div>
      <div className="flex flex-col gap-2">
        <StepTick total={8} current={3} />
        <StepTick total={8} current={7} />
        <StepTick total={8} current={1} />
      </div>
    </div>
  );
}
