import * as TooltipPrimitive from "radix-ui/tooltip";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "./cn";

export const TooltipProvider = TooltipPrimitive.Provider;
export const TooltipRoot = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

type TooltipContentProps = ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & {
  children: ReactNode;
};

export function TooltipContent({ className, children, sideOffset = 6, ...rest }: TooltipContentProps) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          "z-50 rounded-instrument border border-border bg-surface-raised px-2 py-1 font-mono text-2xs text-ink shadow-lg",
          className,
        )}
        {...rest}
      >
        {children}
        <TooltipPrimitive.Arrow className="fill-border" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}
