import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { save } from "@tauri-apps/plugin-dialog";
import { useProjectStore } from "../../../state";
import { Button, TabsContent, TabsList, TabsRoot, TabsTrigger } from "../../../ui";
import { HtmlA3Renderer } from "../../../a3/render/HtmlA3Renderer";
import { errorMessage } from "../launch/errorMessage";
import { buildProjectA3Layout } from "./a3Preview";
import { xlsxExport } from "./xlsxIpc";

const XLSX_FILTER = [{ name: "Excel Workbook", extensions: ["xlsx"] }];

/**
 * SPEC.md §2.2: collapsible, two tabs. "Assistant" only exists when AI is
 * configured and enabled (§8) — Phase 3 never sets `meta.ai.enabled`, but
 * the branch is wired now so Phase 8 doesn't have to touch this file.
 * "A3 Preview" now renders the real `A3LayoutDescriptor` via
 * `HtmlA3Renderer` (Phase 4) — D-34's screen/print modes are a toggle here.
 */
export function RightPanel() {
  const { t } = useTranslation();
  const project = useProjectStore((s) => s.project);
  const [collapsed, setCollapsed] = useState(false);
  const [previewMode, setPreviewMode] = useState<"screen" | "print">("screen");
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const descriptorResult = useMemo(() => {
    if (!project) {
      return null;
    }
    try {
      return { ok: true as const, descriptor: buildProjectA3Layout(project) };
    } catch (error) {
      return { ok: false as const, error };
    }
  }, [project]);

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

  async function handleExport() {
    if (!descriptorResult?.ok) {
      return;
    }
    setExportError(null);
    const destPath = await save({
      title: t("workspace.rightPanel.exportDialogTitle"),
      filters: XLSX_FILTER,
      defaultPath: `A3_${project!.meta.projectCode || project!.meta.title}.xlsx`,
    });
    if (!destPath) {
      return;
    }
    setIsExporting(true);
    try {
      await xlsxExport(descriptorResult.descriptor, destPath);
    } catch (error) {
      setExportError(errorMessage(error));
    } finally {
      setIsExporting(false);
    }
  }

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
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-1">
                <Button
                  variant={previewMode === "screen" ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => setPreviewMode("screen")}
                >
                  {t("workspace.rightPanel.screenMode")}
                </Button>
                <Button
                  variant={previewMode === "print" ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => setPreviewMode("print")}
                >
                  {t("workspace.rightPanel.printMode")}
                </Button>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleExport}
                disabled={!descriptorResult?.ok || isExporting}
              >
                {isExporting ? t("workspace.rightPanel.exporting") : t("workspace.rightPanel.export")}
              </Button>
            </div>
            {exportError && (
              <p className="font-body text-sm text-danger" role="alert">
                {exportError}
              </p>
            )}
            <div className="overflow-auto rounded border border-border">
              {descriptorResult?.ok ? (
                <HtmlA3Renderer descriptor={descriptorResult.descriptor} mode={previewMode} />
              ) : (
                <p className="p-3 font-body text-sm text-ink-muted">
                  {t("workspace.rightPanel.previewError")}
                </p>
              )}
            </div>
          </div>
        </TabsContent>
        {aiEnabled && <TabsContent value="assistant">{null}</TabsContent>}
      </TabsRoot>
    </aside>
  );
}
