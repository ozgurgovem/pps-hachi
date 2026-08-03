import { RowTableEditor } from "../shared/RowTableEditor";
import type { MethodEditorProps } from "../types";
import { CONTAINMENT_ICA_COLUMNS } from "./columns";
import type { ContainmentIcaPayload } from "./schema";

export function ContainmentIcaEditor({ payload, onChange }: MethodEditorProps<ContainmentIcaPayload>) {
  return (
    <RowTableEditor
      idPrefix="containment-ica"
      columns={CONTAINMENT_ICA_COLUMNS}
      rows={payload.rows}
      onChange={(rows) => onChange({ ...payload, rows })}
    />
  );
}
