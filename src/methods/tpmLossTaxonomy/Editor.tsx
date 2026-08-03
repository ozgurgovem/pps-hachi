import { useTranslation } from "react-i18next";
import { Checkbox, Label, SelectContent, SelectItem, SelectRoot, SelectTrigger, SelectValue } from "../../ui";
import type { MethodEditorProps } from "../types";
import {
  TPM_LOSS_CATEGORIES,
  TPM_LOSS_SEVERITIES,
  tpmLossCategoryLabelKey,
  tpmLossSeverityLabelKey,
  type TpmLossCategory,
  type TpmLossSeverity,
} from "./categories";
import type { TpmLossTaxonomyPayload } from "./schema";

export function TpmLossTaxonomyEditor({ payload, onChange }: MethodEditorProps<TpmLossTaxonomyPayload>) {
  const { t } = useTranslation();

  function setApplies(category: TpmLossCategory, applies: boolean) {
    onChange({ ...payload, [category]: { ...payload[category], applies } });
  }

  function setSeverity(category: TpmLossCategory, severity: TpmLossSeverity) {
    onChange({ ...payload, [category]: { ...payload[category], severity } });
  }

  return (
    <div className="flex flex-col gap-2">
      {TPM_LOSS_CATEGORIES.map((category) => {
        const tag = payload[category];
        const checkboxId = `tpm-loss-${category}-applies`;
        return (
          <div key={category} className="flex items-center gap-3 rounded-control border border-border px-3 py-2">
            <Checkbox
              id={checkboxId}
              checked={tag.applies}
              onCheckedChange={(checked) => setApplies(category, checked === true)}
            />
            <Label htmlFor={checkboxId} className="flex-1">
              {t(tpmLossCategoryLabelKey(category))}
            </Label>
            <SelectRoot value={tag.severity} onValueChange={(next) => setSeverity(category, next as TpmLossSeverity)}>
              <SelectTrigger
                id={`tpm-loss-${category}-severity`}
                aria-label={`${t(tpmLossCategoryLabelKey(category))} — ${t("methods.tpmLossTaxonomy.severityLabel")}`}
                className="w-36"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TPM_LOSS_SEVERITIES.map((severity) => (
                  <SelectItem key={severity} value={severity}>
                    {t(tpmLossSeverityLabelKey(severity))}
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectRoot>
          </div>
        );
      })}
    </div>
  );
}
