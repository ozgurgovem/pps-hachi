import * as LabelPrimitive from "radix-ui/label";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "./cn";

export function Label({
  className,
  ...rest
}: ComponentPropsWithoutRef<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      className={cn("font-body text-sm font-medium text-ink", className)}
      {...rest}
    />
  );
}
