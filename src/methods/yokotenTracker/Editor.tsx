import { RowTableEditor } from "../shared/RowTableEditor";
import type { MethodEditorProps } from "../types";
import { YOKOTEN_TRACKER_COLUMNS } from "./columns";
import type { YokotenTrackerPayload } from "./schema";

export function YokotenTrackerEditor({ payload, onChange }: MethodEditorProps<YokotenTrackerPayload>) {
  return (
    <RowTableEditor
      idPrefix="yokoten-tracker"
      columns={YOKOTEN_TRACKER_COLUMNS}
      rows={payload.rows}
      onChange={(rows) => onChange({ ...payload, rows })}
    />
  );
}
