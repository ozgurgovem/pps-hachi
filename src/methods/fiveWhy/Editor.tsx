import { useTranslation } from "react-i18next";
import { Label, Textarea } from "../../ui";
import { WhyChainEditor } from "../shared/WhyChainEditor";
import type { MethodEditorProps } from "../types";
import type { FiveWhyPayload } from "./schema";

export function FiveWhyEditor({ payload, onChange }: MethodEditorProps<FiveWhyPayload>) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="five-why-problem">{t("methods.fiveWhy.problemStatementLabel")}</Label>
        <Textarea
          id="five-why-problem"
          value={payload.problemStatement}
          onChange={(e) => onChange({ ...payload, problemStatement: e.target.value })}
          rows={2}
        />
      </div>
      <WhyChainEditor
        idPrefix="five-why"
        steps={payload.whys}
        onChange={(whys) => onChange({ ...payload, whys })}
      />
    </div>
  );
}
