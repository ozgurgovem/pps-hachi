import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button, Input, Label } from "../../ui";
import { flattenTree, removeSubtree, type TreeNode } from "./nodeTree";

interface NodeTreeEditorProps<T extends TreeNode> {
  readonly idPrefix: string;
  readonly nodes: readonly T[];
  readonly onChange: (nodes: T[]) => void;
  /** Builds a method-specific node from the substrate's base shape (e.g. adding a gate). */
  readonly createNode: (parentId: string | null) => T;
  /** i18next key for a node's text field label. */
  readonly textLabelKey: string;
  /** Optional per-node control rendered beside the text field (the Fault Tree's gate select). */
  readonly renderNodeExtra?: (node: T, update: (next: T) => void) => ReactNode;
}

/**
 * Shared editor for the `nodeTree.ts` substrate — the branching sibling of
 * `WhyChainEditor` (linear) and `RowTableEditor` (flat list). Indentation is
 * the only affordance for depth: a drag-and-drop tree is a Phase 12 polish
 * question, and "Add cause under this one" already expresses the structure
 * with controls that are keyboard reachable by default.
 */
export function NodeTreeEditor<T extends TreeNode>({
  idPrefix,
  nodes,
  onChange,
  createNode,
  textLabelKey,
  renderNodeExtra,
}: NodeTreeEditorProps<T>) {
  const { t } = useTranslation();
  const flattened = flattenTree(nodes);

  function updateNode(next: T) {
    onChange(nodes.map((node) => (node.id === next.id ? next : node)));
  }

  function addChild(parentId: string | null) {
    onChange([...nodes, createNode(parentId)]);
  }

  function remove(nodeId: string) {
    onChange(removeSubtree(nodes, nodeId));
  }

  return (
    <div className="flex flex-col gap-3">
      {flattened.map(({ node, depth }) => {
        const fieldId = `${idPrefix}-${node.id}`;
        return (
          <div
            key={node.id}
            className="flex flex-col gap-2 rounded-control border border-border p-3"
            style={{ marginInlineStart: `${depth * 1.5}rem` }}
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={fieldId}>{t(textLabelKey)}</Label>
              <Input
                id={fieldId}
                value={node.text}
                onChange={(event) => updateNode({ ...node, text: event.target.value })}
              />
            </div>
            {renderNodeExtra?.(node, updateNode)}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => addChild(node.id)}>
                {t("methods.nodeTree.addChild")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove(node.id)}
                aria-label={t("methods.nodeTree.removeNode")}
              >
                ✕
              </Button>
            </div>
          </div>
        );
      })}
      <Button type="button" variant="secondary" size="sm" onClick={() => addChild(null)}>
        {t("methods.nodeTree.addRoot")}
      </Button>
    </div>
  );
}
