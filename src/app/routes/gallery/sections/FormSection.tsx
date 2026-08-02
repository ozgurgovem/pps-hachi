import { useTranslation } from "react-i18next";
import {
  Checkbox,
  Input,
  Label,
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from "../../../../ui";

export function FormSection() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-6 sm:max-w-sm">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="gallery-part-number">{t("gallery.form.labelField")}</Label>
        <Input id="gallery-part-number" placeholder={t("gallery.form.placeholderField")} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="gallery-template">{t("gallery.form.selectLabel")}</Label>
        <SelectRoot>
          <SelectTrigger className="w-full" id="gallery-template">
            <SelectValue placeholder={t("gallery.form.selectPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="farplas-7step-tr">{t("gallery.form.selectFarplas7")}</SelectItem>
            <SelectItem value="farplas-7step-plus">
              {t("gallery.form.selectFarplasPlus")}
            </SelectItem>
            <SelectItem value="pps-8step-auto">{t("gallery.form.selectPps8")}</SelectItem>
          </SelectContent>
        </SelectRoot>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox id="gallery-gate" />
        <Label htmlFor="gallery-gate">{t("gallery.form.checkboxLabel")}</Label>
      </div>
    </div>
  );
}
