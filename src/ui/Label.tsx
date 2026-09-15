import * as LabelPrimitive from "radix-ui/label";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "./cn";

/** Farplas görsel diline taşındı (P-58/D-25x, Grup 1) — bkz. Input.tsx'in kendi notu. */
export function Label({
  className,
  ...rest
}: ComponentPropsWithoutRef<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      className={cn("font-body text-sm font-medium text-fp-charcoal", className)}
      {...rest}
    />
  );
}
