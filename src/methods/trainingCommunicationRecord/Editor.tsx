import { RowTableEditor } from "../shared/RowTableEditor";
import type { MethodEditorProps } from "../types";
import { TRAINING_COMMUNICATION_RECORD_COLUMNS } from "./columns";
import type { TrainingCommunicationRecordPayload } from "./schema";

export function TrainingCommunicationRecordEditor({
  payload,
  onChange,
}: MethodEditorProps<TrainingCommunicationRecordPayload>) {
  return (
    <RowTableEditor
      idPrefix="training-communication-record"
      columns={TRAINING_COMMUNICATION_RECORD_COLUMNS}
      rows={payload.rows}
      onChange={(rows) => onChange({ ...payload, rows })}
    />
  );
}
