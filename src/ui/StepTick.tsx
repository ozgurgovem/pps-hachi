import { cn } from "./cn";

interface StepTickProps {
  /** Total number of steps in the method (PPS Hachi is always 8, but the gauge stays general). */
  total: number;
  /** Number of steps completed so far. */
  current: number;
  className?: string;
  "aria-label"?: string;
}

/**
 * A ruler/gauge-style progress indicator — filled and unfilled ticks in a row,
 * not a percentage bar or dots. See DECISIONS.md D-48 (Phase 1 layout concept).
 */
export function StepTick({ total, current, className, "aria-label": ariaLabel }: StepTickProps) {
  const ticks = Array.from({ length: total }, (_, index) => index < current);

  return (
    <div
      role="img"
      aria-label={ariaLabel ?? `${current} of ${total} steps complete`}
      className={cn("flex items-center gap-[3px] font-mono", className)}
    >
      {ticks.map((filled, index) => (
        <span
          key={index}
          aria-hidden="true"
          className={cn("h-3 w-[3px]", filled ? "bg-accent" : "bg-border/30")}
        />
      ))}
    </div>
  );
}
