import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "./cn";

/** Farplas görsel diline taşındı (P-58/D-25x, Grup 2) — bkz. Input.tsx'in kendi notu.
 * `rounded-md` (D-49'un keskin 2px `--radius-instrument`'inden yumuşatıldı, Checkbox'ın
 * kendi Grup 1 kararıyla tutarlı); her status rolü P-68'in düzeltilmiş v2 paletinden. */
const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-2xs uppercase tracking-wide",
  {
    variants: {
      status: {
        empty: "border-fp-gray-dark text-fp-gray-dark",
        "in-progress": "border-fp-teal text-fp-teal-deep",
        complete: "border-fp-gray-dark bg-surface-raised text-fp-charcoal",
        flagged: "border-fp-red text-fp-red",
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
