import { FieldFormEditor } from "../shared/FieldFormEditor";
import type { MethodEditorProps } from "../types";
import { GEMBA_OBSERVATION_LOG_FIELDS, type GembaObservationLogFieldKey } from "./fields";
import type { GembaObservationLogPayload } from "./schema";

/**
 * The `photos` slot itself is rendered by the generic `EntryImagesField`
 * shell (`EntryEditorPanel`, driven by `gembaObservationLogMethod.imageSlots`)
 * — this Editor only owns the four `payload` fields, same split D-118/D-193
 * establishes for every image-bearing method.
 */
export function GembaObservationLogEditor({
  payload,
  onChange,
}: MethodEditorProps<GembaObservationLogPayload>) {
  return (
    <FieldFormEditor<GembaObservationLogFieldKey>
      idPrefix="gemba-observation-log"
      fields={GEMBA_OBSERVATION_LOG_FIELDS}
      values={payload}
      onChange={(values) => onChange({ ...payload, ...values })}
    />
  );
}
