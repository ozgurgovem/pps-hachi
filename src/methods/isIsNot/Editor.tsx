import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { Label, Textarea } from "../../ui";
import type { MethodEditorProps } from "../types";
import { IS_IS_NOT_DIMENSIONS } from "./dimensions";
import type { IsIsNotPayload } from "./schema";

export function IsIsNotEditor({ payload, onChange }: MethodEditorProps<IsIsNotPayload>) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-[auto_1fr_1fr] items-center gap-2">
        <span />
        <span className="font-body text-xs font-medium text-ink-muted">{t("methods.isIsNot.isLabel")}</span>
        <span className="font-body text-xs font-medium text-ink-muted">{t("methods.isIsNot.isNotLabel")}</span>
        {IS_IS_NOT_DIMENSIONS.map(([dimension, isKey, isNotKey]) => (
          <Fragment key={dimension}>
            <Label htmlFor={`is-is-not-${isKey}`} className="font-medium">
              {t(`methods.isIsNot.dimensions.${dimension}`)}
            </Label>
            <Textarea
              id={`is-is-not-${isKey}`}
              value={payload[isKey]}
              onChange={(e) => onChange({ ...payload, [isKey]: e.target.value })}
              rows={2}
            />
            <Textarea
              id={`is-is-not-${isNotKey}`}
              aria-label={`${t(`methods.isIsNot.dimensions.${dimension}`)} — ${t("methods.isIsNot.isNotLabel")}`}
              value={payload[isNotKey]}
              onChange={(e) => onChange({ ...payload, [isNotKey]: e.target.value })}
              rows={2}
            />
          </Fragment>
        ))}
      </div>
    </div>
  );
}
