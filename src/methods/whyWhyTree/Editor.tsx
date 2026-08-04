import { NodeTreeEditor } from "../shared/NodeTreeEditor";
import { newTreeNode } from "../shared/nodeTree";
import type { MethodEditorProps } from "../types";
import type { WhyWhyNode, WhyWhyTreePayload } from "./schema";

export function WhyWhyTreeEditor({ payload, onChange }: MethodEditorProps<WhyWhyTreePayload>) {
  return (
    <NodeTreeEditor<WhyWhyNode>
      idPrefix="why-why-tree"
      nodes={payload.nodes}
      onChange={(nodes) => onChange({ ...payload, nodes })}
      createNode={(parentId) => ({ ...newTreeNode(parentId) })}
      textLabelKey="methods.whyWhyTree.nodeLabel"
    />
  );
}
