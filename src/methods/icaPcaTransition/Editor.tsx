import { FieldFormEditor } from "../shared/FieldFormEditor";
import type { MethodEditorProps } from "../types";
import { ICA_PCA_TRANSITION_FIELDS, type IcaPcaTransitionFieldKey } from "./fields";
import type { IcaPcaTransitionPayload } from "./schema";

export function IcaPcaTransitionEditor({ payload, onChange }: MethodEditorProps<IcaPcaTransitionPayload>) {
  return (
    <FieldFormEditor<IcaPcaTransitionFieldKey>
      idPrefix="ica-pca-transition"
      fields={ICA_PCA_TRANSITION_FIELDS}
      values={payload}
      onChange={(values) => onChange({ ...payload, ...values })}
    />
  );
}
