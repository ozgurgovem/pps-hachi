import { FieldFormEditor } from "../shared/FieldFormEditor";
import type { MethodEditorProps } from "../types";
import { FIVE_W2H_FIELDS, type FiveW2HFieldKey } from "./fields";
import type { FiveW2HPayload } from "./schema";

export function FiveW2HEditor({ payload, onChange }: MethodEditorProps<FiveW2HPayload>) {
  return (
    <FieldFormEditor<FiveW2HFieldKey>
      idPrefix="5w2h"
      fields={FIVE_W2H_FIELDS}
      values={payload}
      onChange={(values) => onChange({ ...payload, ...values })}
    />
  );
}
