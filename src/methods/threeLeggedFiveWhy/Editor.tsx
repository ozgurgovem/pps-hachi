import { useTranslation } from "react-i18next";
import { Label, Textarea } from "../../ui";
import { WhyChainEditor } from "../shared/WhyChainEditor";
import type { MethodEditorProps } from "../types";
import type { ThreeLeggedFiveWhyPayload } from "./schema";

export function ThreeLeggedFiveWhyEditor({ payload, onChange }: MethodEditorProps<ThreeLeggedFiveWhyPayload>) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="three-legged-problem">{t("methods.threeLeggedFiveWhy.problemStatementLabel")}</Label>
        <Textarea
          id="three-legged-problem"
          value={payload.problemStatement}
          onChange={(e) => onChange({ ...payload, problemStatement: e.target.value })}
          rows={2}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <WhyChainEditor
          idPrefix="three-legged-occurrence"
          legLabel={t("methods.threeLeggedFiveWhy.occurrenceLabel")}
          steps={payload.occurrence}
          onChange={(occurrence) => onChange({ ...payload, occurrence })}
        />
        <WhyChainEditor
          idPrefix="three-legged-detection"
          legLabel={t("methods.threeLeggedFiveWhy.detectionLabel")}
          steps={payload.detection}
          onChange={(detection) => onChange({ ...payload, detection })}
        />
        <WhyChainEditor
          idPrefix="three-legged-systemic"
          legLabel={t("methods.threeLeggedFiveWhy.systemicLabel")}
          steps={payload.systemic}
          onChange={(systemic) => onChange({ ...payload, systemic })}
        />
      </div>
    </div>
  );
}
