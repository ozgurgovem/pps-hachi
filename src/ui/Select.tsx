import * as SelectPrimitive from "radix-ui/select";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "./cn";

export const SelectRoot = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;

type SelectTriggerProps = ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>;

export function SelectTrigger({ className, children, ...rest }: SelectTriggerProps) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        "flex h-9 w-full items-center justify-between gap-2 rounded-control border border-border",
        "bg-surface px-3 font-body text-sm text-ink data-[placeholder]:text-ink-muted",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...rest}
    >
      {children}
      <SelectPrimitive.Icon>
        <ChevronIcon />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

type SelectContentProps = ComponentPropsWithoutRef<typeof SelectPrimitive.Content>;

export function SelectContent({ children, ...rest }: SelectContentProps) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        className="z-50 overflow-hidden rounded-control border border-border bg-surface-raised text-ink shadow-lg"
        position="popper"
        sideOffset={4}
        {...rest}
      >
        <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

type SelectItemProps = ComponentPropsWithoutRef<typeof SelectPrimitive.Item>;

export function SelectItem({ value, children, className, ...rest }: SelectItemProps) {
  return (
    <SelectPrimitive.Item
      value={value}
      className={cn(
        "relative flex h-8 cursor-pointer select-none items-center rounded-instrument px-3 font-body text-sm",
        "outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-ink",
        className,
      )}
      {...rest}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

function ChevronIcon() {
  return (
    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">
      <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
