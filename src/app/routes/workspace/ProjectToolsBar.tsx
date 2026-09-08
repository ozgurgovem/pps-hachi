import { useState } from "react";
import { useTranslation } from "react-i18next";
import { save } from "@tauri-apps/plugin-dialog";
import { useProjectStore } from "../../../state";
import { Button, DialogContent, DialogRoot } from "../../../ui";
import { openOrFocusA3PreviewWindow } from "../a3PreviewWindow/window";
import { errorMessage } from "../launch/errorMessage";
import { LayoutReviewPanel } from "./LayoutReviewPanel";
import { MockAuditPanel } from "./MockAuditPanel";
import { TranslateReportPanel } from "./TranslateReportPanel";
import { TraceabilityView } from "./TraceabilityView";
import { useA3PreviewSync } from "./useA3PreviewSync";
import { xlsxExport } from "./xlsxIpc";

const XLSX_FILTER = [{ name: "Excel Workbook", extensions: ["xlsx"] }];

type ToolDialog = "traceability" | "review" | "audit" | "translate";

/**
 * W2/D-217: replaces the removed `RightPanel` for everything that isn't
 * step-scoped. Export and İzlenebilirlik (Traceability) are always
 * available — Traceability needs no AI at all, and losing that when no
 * model is configured would be a real regression against "the app is fully
 * functional with AI off." İnceleme/Denetim/Çeviri stay `aiEnabled`-gated,
 * exactly as they were as `RightPanel` tabs. Each opens its own real,
 * unchanged component in a dialog — not a text summary — since none of the
 * four is a one-shot answer (checkboxes to apply, findings to jump from,
 * lines to accept).
 */
export function ProjectToolsBar() {
  const { t } = useTranslation();
  const project = useProjectStore((s) => s.project);
  const descriptorResult = useA3PreviewSync();
  const [openDialog, setOpenDialog] = useState<ToolDialog | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  if (!project) {
    return null;
  }

  const aiEnabled = project.meta.ai.enabled;

  async function handleExport() {
    if (descriptorResult.status !== "ok") {
      return;
    }
    setExportError(null);
    const destPath = await save({
      title: t("workspace.projectTools.exportDialogTitle"),
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
    <div className="flex items-center gap-2">
      {exportError && (
        <p role="alert" className="font-body text-xs text-danger">
          {exportError}
        </p>
      )}
      <Button
        variant="secondary"
        size="sm"
        onClick={() => void handleExport()}
        disabled={descriptorResult.status !== "ok" || isExporting}
      >
        {isExporting ? t("workspace.projectTools.exporting") : t("workspace.projectTools.export")}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => void openOrFocusA3PreviewWindow()}>
        {t("workspace.stepOverview.openA3Preview")}
      </Button>

      <div className="flex items-center gap-1 border-l border-border pl-2">
        <span className="font-mono text-2xs uppercase tracking-wide text-ink-muted">
          {t("workspace.projectTools.groupLabel")}
        </span>
        <Button variant="ghost" size="sm" onClick={() => setOpenDialog("traceability")}>
          {t("workspace.projectTools.traceability")}
        </Button>
        {aiEnabled && (
          <Button variant="ghost" size="sm" onClick={() => setOpenDialog("review")}>
            {t("workspace.projectTools.review")}
          </Button>
        )}
        {aiEnabled && (
          <Button variant="ghost" size="sm" onClick={() => setOpenDialog("audit")}>
            {t("workspace.projectTools.audit")}
          </Button>
        )}
        {aiEnabled && (
          <Button variant="ghost" size="sm" onClick={() => setOpenDialog("translate")}>
            {t("workspace.projectTools.translate")}
          </Button>
        )}
      </div>

      <DialogRoot open={openDialog === "traceability"} onOpenChange={(open) => !open && setOpenDialog(null)}>
        {openDialog === "traceability" && (
          <DialogContent title={t("workspace.projectTools.traceability")} className="max-w-2xl">
            <TraceabilityView />
          </DialogContent>
        )}
      </DialogRoot>

      <DialogRoot open={openDialog === "review"} onOpenChange={(open) => !open && setOpenDialog(null)}>
        {openDialog === "review" && descriptorResult.status === "ok" && (
          <DialogContent title={t("workspace.projectTools.review")} className="max-w-2xl">
            <LayoutReviewPanel descriptor={descriptorResult.descriptor} />
          </DialogContent>
        )}
      </DialogRoot>

      <DialogRoot open={openDialog === "audit"} onOpenChange={(open) => !open && setOpenDialog(null)}>
        {openDialog === "audit" && (
          <DialogContent title={t("workspace.projectTools.audit")} className="max-w-2xl">
            <MockAuditPanel />
          </DialogContent>
        )}
      </DialogRoot>

      <DialogRoot open={openDialog === "translate"} onOpenChange={(open) => !open && setOpenDialog(null)}>
        {openDialog === "translate" && (
          <DialogContent title={t("workspace.projectTools.translate")} className="max-w-2xl">
            <TranslateReportPanel />
          </DialogContent>
        )}
      </DialogRoot>
    </div>
  );
}
