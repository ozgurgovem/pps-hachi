import { useTranslation } from "react-i18next";
import { Label, SelectContent, SelectItem, SelectRoot, SelectTrigger, SelectValue } from "../../ui";
import { NodeTreeEditor } from "../shared/NodeTreeEditor";
import { newTreeNode } from "../shared/nodeTree";
import type { MethodEditorProps } from "../types";
import { FAULT_TREE_GATES, faultTreeGateLabelKey, type FaultTreeGate } from "./gates";
import type { FaultTreeNode, FaultTreePayload } from "./schema";

export function FaultTreeEditor({ payload, onChange }: MethodEditorProps<FaultTreePayload>) {
  const { t } = useTranslation();

  return (
    <NodeTreeEditor<FaultTreeNode>
      idPrefix="fault-tree"
      nodes={payload.nodes}
      onChange={(nodes) => onChange({ ...payload, nodes })}
      createNode={(parentId) => ({ ...newTreeNode(parentId), gate: "basic" })}
      textLabelKey="methods.faultTree.nodeLabel"
      renderNodeExtra={(node, update) => (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`fault-tree-${node.id}-gate`}>{t("methods.faultTree.gateLabel")}</Label>
          <SelectRoot value={node.gate} onValueChange={(next) => update({ ...node, gate: next as FaultTreeGate })}>
            <SelectTrigger id={`fault-tree-${node.id}-gate`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FAULT_TREE_GATES.map((gate) => (
                <SelectItem key={gate} value={gate}>
                  {t(faultTreeGateLabelKey(gate))}
                </SelectItem>
              ))}
            </SelectContent>
          </SelectRoot>
        </div>
      )}
    />
  );
}
