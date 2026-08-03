import { useTranslation } from "react-i18next";
import { Input, Label, SelectContent, SelectItem, SelectRoot, SelectTrigger, SelectValue, Textarea } from "../../ui";
import type { MethodEditorProps } from "../types";
import { MSA_GAGE_RR_VERDICTS, msaGageRrVerdictLabelKey, type MsaGageRrVerdict } from "./verdicts";
import type { MsaGageRrPayload } from "./schema";

export function MsaGageRrEditor({ payload, onChange }: MethodEditorProps<MsaGageRrPayload>) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="msa-gage-rr-method">{t("methods.msaGageRr.methodLabel")}</Label>
          <Input
            id="msa-gage-rr-method"
            value={payload.method}
            onChange={(event) => onChange({ ...payload, method: event.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="msa-gage-rr-evaluator">{t("methods.msaGageRr.evaluatorLabel")}</Label>
          <Input
            id="msa-gage-rr-evaluator"
            value={payload.evaluator}
            onChange={(event) => onChange({ ...payload, evaluator: event.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="msa-gage-rr-date">{t("methods.msaGageRr.dateLabel")}</Label>
          <Input
            id="msa-gage-rr-date"
            type="date"
            value={payload.date}
            onChange={(event) => onChange({ ...payload, date: event.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="msa-gage-rr-percent-grr">{t("methods.msaGageRr.percentGrrLabel")}</Label>
          <Input
            id="msa-gage-rr-percent-grr"
            value={payload.percentGrr}
            onChange={(event) => onChange({ ...payload, percentGrr: event.target.value })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="msa-gage-rr-verdict">{t("methods.msaGageRr.verdictLabel")}</Label>
        <SelectRoot
          value={payload.verdict}
          onValueChange={(next) => onChange({ ...payload, verdict: next as MsaGageRrVerdict })}
        >
          <SelectTrigger id="msa-gage-rr-verdict">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MSA_GAGE_RR_VERDICTS.map((verdict) => (
              <SelectItem key={verdict} value={verdict}>
                {t(msaGageRrVerdictLabelKey(verdict))}
              </SelectItem>
            ))}
          </SelectContent>
        </SelectRoot>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="msa-gage-rr-note">{t("methods.msaGageRr.noteLabel")}</Label>
        <Textarea
          id="msa-gage-rr-note"
          value={payload.note}
          onChange={(event) => onChange({ ...payload, note: event.target.value })}
          rows={3}
        />
      </div>
    </div>
  );
}
