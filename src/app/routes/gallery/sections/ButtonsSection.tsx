import { useTranslation } from "react-i18next";
import { Button } from "../../../../ui";

export function ButtonsSection() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="primary">{t("gallery.buttons.primary")}</Button>
      <Button variant="secondary">{t("gallery.buttons.secondary")}</Button>
      <Button variant="ghost">{t("gallery.buttons.ghost")}</Button>
      <Button variant="primary" size="sm">
        {t("gallery.buttons.small")}
      </Button>
      <Button variant="primary" size="lg">
        {t("gallery.buttons.large")}
      </Button>
      <Button variant="primary" disabled>
        {t("gallery.buttons.disabled")}
      </Button>
    </div>
  );
}
