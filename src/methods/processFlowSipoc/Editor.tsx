import { RowTableEditor } from "../shared/RowTableEditor";
import type { MethodEditorProps } from "../types";
import { PROCESS_FLOW_SIPOC_COLUMNS } from "./columns";
import type { ProcessFlowSipocPayload } from "./schema";

export function ProcessFlowSipocEditor({ payload, onChange }: MethodEditorProps<ProcessFlowSipocPayload>) {
  return (
    <RowTableEditor
      idPrefix="process-flow-sipoc"
      columns={PROCESS_FLOW_SIPOC_COLUMNS}
      rows={payload.rows}
      onChange={(rows) => onChange({ ...payload, rows })}
    />
  );
}
