import { FieldFormEditor } from "../shared/FieldFormEditor";
import type { MethodEditorProps } from "../types";
import { REALIZED_COST_BENEFIT_FIELDS, type RealizedCostBenefitFieldKey } from "./fields";
import type { RealizedCostBenefitPayload } from "./schema";

export function RealizedCostBenefitEditor({ payload, onChange }: MethodEditorProps<RealizedCostBenefitPayload>) {
  return (
    <FieldFormEditor<RealizedCostBenefitFieldKey>
      idPrefix="realized-cost-benefit"
      fields={REALIZED_COST_BENEFIT_FIELDS}
      values={payload}
      onChange={(values) => onChange({ ...payload, ...values })}
    />
  );
}
