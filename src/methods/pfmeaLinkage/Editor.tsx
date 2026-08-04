import { FieldFormEditor } from "../shared/FieldFormEditor";
import type { MethodEditorProps } from "../types";
import { PFMEA_LINKAGE_FIELDS, type PfmeaLinkageFieldKey } from "./fields";
import type { PfmeaLinkagePayload } from "./schema";

export function PfmeaLinkageEditor({ payload, onChange }: MethodEditorProps<PfmeaLinkagePayload>) {
  return (
    <FieldFormEditor<PfmeaLinkageFieldKey>
      idPrefix="pfmea-linkage"
      fields={PFMEA_LINKAGE_FIELDS}
      values={payload}
      onChange={(values) => onChange({ ...payload, ...values })}
    />
  );
}
