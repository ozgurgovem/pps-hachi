/**
 * SPEC.md §1.3 (Step 4): "Fault Tree Analysis (FTA) with AND/OR gates".
 *
 * The gate belongs to the *parent* — it says how that node's children combine
 * to produce it. `basic` is a leaf (a basic event, no children to combine),
 * which is why it is the default for a freshly added node rather than `or`:
 * a new node has no children yet, and defaulting to a gate would assert a
 * logic the user has not stated.
 */
export const FAULT_TREE_GATES = ["basic", "and", "or"] as const;

export type FaultTreeGate = (typeof FAULT_TREE_GATES)[number];

export function faultTreeGateLabelKey(gate: FaultTreeGate): string {
  return `methods.faultTree.gates.${gate}`;
}

/** A3-side marker — `src/a3` is React-free and i18n-free, same as every other `renderToA3`. */
export const FAULT_TREE_GATE_MARKERS: Readonly<Record<FaultTreeGate, string>> = {
  basic: "",
  and: "[AND] ",
  or: "[OR] ",
};
