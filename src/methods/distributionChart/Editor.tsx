import { useTranslation } from "react-i18next";
import { Input, Label, SelectContent, SelectItem, SelectRoot, SelectTrigger, SelectValue } from "../../ui";
import type { MethodEditorProps } from "../types";
import { RowTableEditor } from "../shared/RowTableEditor";
import { DISTRIBUTION_CHART_TYPES, type DistributionChartPayload } from "./schema";

const SAMPLE_COLUMNS = [{ key: "value", labelKey: "methods.distributionChart.valueColumn", type: "text" }] as const;
const POINT_COLUMNS = [
  { key: "x", labelKey: "methods.distributionChart.xColumn", type: "text" },
  { key: "y", labelKey: "methods.distributionChart.yColumn", type: "text" },
] as const;

export function DistributionChartEditor({ payload, onChange }: MethodEditorProps<DistributionChartPayload>) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="distribution-chart-type">{t("methods.distributionChart.chartTypeLabel")}</Label>
          <SelectRoot
            value={payload.chartType}
            onValueChange={(next) => onChange({ ...payload, chartType: next as DistributionChartPayload["chartType"] })}
          >
            <SelectTrigger id="distribution-chart-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DISTRIBUTION_CHART_TYPES.map((chartType) => (
                <SelectItem key={chartType} value={chartType}>
                  {t(`methods.distributionChart.chartTypes.${chartType}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </SelectRoot>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="distribution-chart-unit">{t("methods.distributionChart.unitLabel")}</Label>
          <Input id="distribution-chart-unit" value={payload.unit} onChange={(e) => onChange({ ...payload, unit: e.target.value })} />
        </div>
        {payload.chartType === "histogram" && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="distribution-chart-bins">{t("methods.distributionChart.binCountLabel")}</Label>
            <Input
              id="distribution-chart-bins"
              inputMode="numeric"
              placeholder={t("methods.distributionChart.binCountPlaceholder")}
              value={payload.binCount}
              onChange={(e) => onChange({ ...payload, binCount: e.target.value })}
            />
          </div>
        )}
      </div>

      {payload.chartType === "scatter" ? (
        <RowTableEditor
          idPrefix="distribution-chart-point"
          columns={POINT_COLUMNS}
          rows={payload.points}
          onChange={(points) => onChange({ ...payload, points })}
        />
      ) : (
        <RowTableEditor
          idPrefix="distribution-chart-sample"
          columns={SAMPLE_COLUMNS}
          rows={payload.samples}
          onChange={(samples) => onChange({ ...payload, samples })}
        />
      )}
    </div>
  );
}
