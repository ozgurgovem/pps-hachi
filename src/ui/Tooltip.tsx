import * as TooltipPrimitive from "radix-ui/tooltip";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "./cn";

export const TooltipProvider = TooltipPrimitive.Provider;
export const TooltipRoot = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

type TooltipContentProps = ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & {
  children: ReactNode;
};

/** Farplas görsel diline taşındı (P-58/D-25x, Grup 2) — bkz. Input.tsx'in kendi notu. */
export function TooltipContent({ className, children, sideOffset = 6, ...rest }: TooltipContentProps) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          "z-50 rounded-md border border-fp-gray-dark bg-surface-raised px-2 py-1 font-mono text-2xs text-fp-charcoal shadow-lg",
          className,
        )}
        {...rest}
      >
        {children}
        <TooltipPrimitive.Arrow className="fill-fp-gray-dark" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}
