import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "./cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-instrument border px-2 py-0.5 font-mono text-2xs uppercase tracking-wide",
  {
    variants: {
      status: {
        empty: "border-border text-ink-muted",
        "in-progress": "border-accent text-accent",
        complete: "border-border bg-surface-raised text-ink",
        flagged: "border-danger text-danger",
      },
    },
    defaultVariants: {
      status: "empty",
    },
  },
);

type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, status, ...rest }: BadgeProps) {
  return <span className={cn(badgeVariants({ status }), className)} {...rest} />;
}
