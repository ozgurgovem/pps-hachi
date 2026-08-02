import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useProjectStore } from "../../../state";
import { Button, TabsContent, TabsList, TabsRoot, TabsTrigger } from "../../../ui";

/**
 * SPEC.md §2.2: collapsible, two tabs. "Assistant" only exists when AI is
 * configured and enabled (§8) — Phase 3 never sets `meta.ai.enabled`, but
 * the branch is wired now so Phase 8 doesn't have to touch this file.
 * "A3 Preview" is a stub until the descriptor/renderer ship in Phase 4.
 */
export function RightPanel() {
  const { t } = useTranslation();
  const project = useProjectStore((s) => s.project);
  const [collapsed, setCollapsed] = useState(false);

  if (!project) {
    return null;
  }

  if (collapsed) {
    return (
      <div className="flex shrink-0 border-l border-border bg-surface-raised p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(false)}
          aria-label={t("workspace.rightPanel.expand")}
        >
          «
        </Button>
      </div>
    );
  }

  const aiEnabled = project.meta.ai.enabled;

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-border bg-surface-raised">
      <div className="flex justify-end border-b border-border p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(true)}
          aria-label={t("workspace.rightPanel.collapse")}
        >
          »
        </Button>
      </div>
      <TabsRoot defaultValue="preview" className="flex flex-1 flex-col p-3">
        <TabsList>
          <TabsTrigger value="preview">{t("workspace.rightPanel.preview")}</TabsTrigger>
          {aiEnabled && <TabsTrigger value="assistant">{t("workspace.rightPanel.assistant")}</TabsTrigger>}
        </TabsList>
        <TabsContent value="preview">
          <p className="font-body text-sm text-ink-muted">{t("workspace.rightPanel.previewStub")}</p>
        </TabsContent>
        {aiEnabled && <TabsContent value="assistant">{null}</TabsContent>}
      </TabsRoot>
    </aside>
  );
}
