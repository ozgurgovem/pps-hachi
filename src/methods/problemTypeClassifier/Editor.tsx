import { useTranslation } from "react-i18next";
import { Label, SelectContent, SelectItem, SelectRoot, SelectTrigger, SelectValue, Textarea } from "../../ui";
import type { MethodEditorProps } from "../types";
import { classificationLabelKey, PROBLEM_TYPE_CLASSIFICATIONS, type ProblemTypeClassification } from "./classifications";
import type { ProblemTypeClassifierPayload } from "./schema";

export function ProblemTypeClassifierEditor({ payload, onChange }: MethodEditorProps<ProblemTypeClassifierPayload>) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="problem-type-classification">{t("methods.problemTypeClassifier.classificationLabel")}</Label>
        <SelectRoot
          value={payload.classification}
          onValueChange={(next) => onChange({ ...payload, classification: next as ProblemTypeClassification })}
        >
          <SelectTrigger id="problem-type-classification">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PROBLEM_TYPE_CLASSIFICATIONS.map((classification) => (
              <SelectItem key={classification} value={classification}>
                {t(classificationLabelKey(classification))}
              </SelectItem>
            ))}
          </SelectContent>
        </SelectRoot>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="problem-type-note">{t("methods.problemTypeClassifier.noteLabel")}</Label>
        <Textarea
          id="problem-type-note"
          value={payload.note}
          onChange={(event) => onChange({ ...payload, note: event.target.value })}
          rows={3}
        />
      </div>
    </div>
  );
}
