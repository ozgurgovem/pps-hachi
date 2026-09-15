import * as CheckboxPrimitive from "radix-ui/checkbox";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "./cn";

type CheckboxProps = ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>;

/** Farplas görsel diline taşındı (P-58/D-25x, Grup 1) — işaretli dolgu artık
 * `--accent`/`--accent-ink` yerine aynı desenin Farplas karşılığı olan
 * `fp-accent-fill`/`fp-accent-fill-ink`'i kullanıyor (bkz. Input.tsx'in
 * kendi notu ve src/index.css'in P-58/P-68 yorumu). */
export function Checkbox({ className, ...rest }: CheckboxProps) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        "flex h-4 w-4 shrink-0 items-center justify-center rounded-md border border-fp-gray-dark bg-surface",
        "data-[state=checked]:border-fp-accent-fill data-[state=checked]:bg-fp-accent-fill",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fp-teal focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...rest}
    >
      <CheckboxPrimitive.Indicator className="text-fp-accent-fill-ink">
        <CheckIcon />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

function CheckIcon() {
  return (
    <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
      <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
