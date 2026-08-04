import { RowTableEditor } from "../shared/RowTableEditor";
import type { MethodEditorProps } from "../types";
import { HYPOTHESIS_VERIFICATION_COLUMNS } from "./columns";
import type { HypothesisVerificationPayload } from "./schema";

/**
 * The `pointOfCause` reference is **not** edited here. `EntryEditorDialog`
 * renders the generic picker from this plugin's `referenceRoles` (D-116), so
 * this Editor stays payload-only like every other one.
 */
export function HypothesisVerificationEditor({
  payload,
  onChange,
}: MethodEditorProps<HypothesisVerificationPayload>) {
  return (
    <RowTableEditor
      idPrefix="hypothesis-verification"
      columns={HYPOTHESIS_VERIFICATION_COLUMNS}
      rows={payload.rows}
      onChange={(rows) => onChange({ ...payload, rows })}
    />
  );
}
