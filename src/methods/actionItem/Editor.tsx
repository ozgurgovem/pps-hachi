import { FieldFormEditor } from "../shared/FieldFormEditor";
import type { MethodEditorProps } from "../types";
import { ACTION_ITEM_FIELDS, type ActionItemFieldKey } from "./fields";
import type { ActionItemPayload } from "./schema";

export function ActionItemEditor({ payload, onChange }: MethodEditorProps<ActionItemPayload>) {
  return (
    <FieldFormEditor<ActionItemFieldKey>
      idPrefix="action-item"
      fields={ACTION_ITEM_FIELDS}
      values={payload}
      onChange={(values) => onChange({ ...payload, ...values })}
    />
  );
}
