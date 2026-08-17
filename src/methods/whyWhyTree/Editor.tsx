import { useTranslation } from "react-i18next";
import { Label, SelectContent, SelectItem, SelectRoot, SelectTrigger, SelectValue } from "../../ui";
import { NodeTreeEditor } from "../shared/NodeTreeEditor";
import { childrenOf, newTreeNode } from "../shared/nodeTree";
import type { MethodEditorProps } from "../types";
import { WhyWhyTreeDiagram } from "./WhyWhyTreeDiagram";
import { WHY_WHY_OUTCOMES, type WhyWhyNode, type WhyWhyOutcome, type WhyWhyTreePayload } from "./schema";

/** Radix `Select.Item` rejects an empty-string value — this sentinel stands in for "not yet decided" (`outcome === undefined`). */
const UNSET_OUTCOME = "unset";

function outcomeLabelKey(outcome: WhyWhyOutcome): string {
  return `methods.whyWhyTree.outcome.${outcome}`;
}

/**
 * D-176/P-35: the real form's ✓/❌+KN{N} distinction, mirroring
 * `FaultTreeEditor`'s `renderNodeExtra` gate select. Shown only on the
 * node's *current* leaves (§2.2) — a mid-chain reasoning step never gets a
 * terminal mark in the real form, and once a marked leaf gains a child the
 * selector disappears (the stored `outcome` is left untouched, not cleared).
 */
export function WhyWhyTreeEditor({ payload, onChange }: MethodEditorProps<WhyWhyTreePayload>) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      <div className="h-72 rounded-control border border-border">
        <WhyWhyTreeDiagram payload={payload} interactive />
      </div>

      <NodeTreeEditor<WhyWhyNode>
        idPrefix="why-why-tree"
        nodes={payload.nodes}
        onChange={(nodes) => onChange({ ...payload, nodes })}
        createNode={(parentId) => ({ ...newTreeNode(parentId) })}
        textLabelKey="methods.whyWhyTree.nodeLabel"
        renderNodeExtra={(node, update) => {
          if (childrenOf(payload.nodes, node.id).length > 0) {
            return null;
          }
          const fieldId = `why-why-tree-outcome-${node.id}`;
          return (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={fieldId}>{t("methods.whyWhyTree.outcomeLabel")}</Label>
              <SelectRoot
                value={node.outcome ?? UNSET_OUTCOME}
                onValueChange={(value) =>
                  update({ ...node, outcome: value === UNSET_OUTCOME ? undefined : value })
                }
              >
                <SelectTrigger id={fieldId}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNSET_OUTCOME}>{t("methods.whyWhyTree.outcome.unset")}</SelectItem>
                  {WHY_WHY_OUTCOMES.map((outcome) => (
                    <SelectItem key={outcome} value={outcome}>
                      {t(outcomeLabelKey(outcome))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </SelectRoot>
            </div>
          );
        }}
      />
    </div>
  );
}
