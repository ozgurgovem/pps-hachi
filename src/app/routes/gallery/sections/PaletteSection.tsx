import { useTranslation } from "react-i18next";

const semanticSwatches = [
  { name: "surface", className: "bg-surface" },
  { name: "surface-raised", className: "bg-surface-raised" },
  { name: "ink", className: "bg-ink" },
  { name: "ink-muted", className: "bg-ink-muted" },
  { name: "line", className: "bg-line" },
  { name: "border", className: "bg-border" },
  { name: "accent", className: "bg-accent" },
  { name: "muted", className: "bg-muted" },
  { name: "danger", className: "bg-danger" },
] as const;

const sheetOnlySwatches = [
  { name: "plan", className: "bg-plan" },
  { name: "do", className: "bg-do" },
  { name: "check", className: "bg-check" },
  { name: "act", className: "bg-act" },
] as const;

function Swatch({ name, className }: { name: string; className: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className={`h-16 w-full rounded-control border border-border ${className}`} />
      <span className="font-mono text-2xs text-ink-muted">{name}</span>
    </div>
  );
}

export function PaletteSection() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-3 gap-4 sm:grid-cols-5">
        {semanticSwatches.map((swatch) => (
          <Swatch key={swatch.name} {...swatch} />
        ))}
      </div>
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-4 gap-4 sm:max-w-md">
          {sheetOnlySwatches.map((swatch) => (
            <Swatch key={swatch.name} {...swatch} />
          ))}
        </div>
        <p className="font-body text-xs text-ink-muted">{t("gallery.palette.sheetOnlyNote")}</p>
      </div>
    </div>
  );
}
