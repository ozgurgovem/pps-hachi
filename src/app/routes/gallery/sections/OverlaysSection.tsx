import { useTranslation } from "react-i18next";
import {
  Button,
  DialogClose,
  DialogContent,
  DialogRoot,
  DialogTrigger,
  TooltipContent,
  TooltipRoot,
  TooltipTrigger,
} from "../../../../ui";

export function OverlaysSection() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center gap-4">
      <TooltipRoot>
        <TooltipTrigger asChild>
          <Button variant="secondary">{t("gallery.overlays.tooltipTrigger")}</Button>
        </TooltipTrigger>
        <TooltipContent>{t("gallery.overlays.tooltipText")}</TooltipContent>
      </TooltipRoot>

      <DialogRoot>
        <DialogTrigger asChild>
          <Button variant="secondary">{t("gallery.overlays.dialogTrigger")}</Button>
        </DialogTrigger>
        <DialogContent
          title={t("gallery.overlays.dialogTitle")}
          description={t("gallery.overlays.dialogDescription")}
        >
          <DialogClose asChild>
            <Button variant="primary">{t("gallery.overlays.dialogClose")}</Button>
          </DialogClose>
        </DialogContent>
      </DialogRoot>
    </div>
  );
}
