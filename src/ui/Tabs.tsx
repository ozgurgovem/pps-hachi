import * as TabsPrimitive from "radix-ui/tabs";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "./cn";

export const TabsRoot = TabsPrimitive.Root;

/** Farplas görsel diline taşındı (P-58/D-25x, Grup 3) — bkz. Input.tsx'in kendi notu. */
export function TabsList({ className, ...rest }: ComponentPropsWithoutRef<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        "inline-flex h-9 items-center gap-1 border-b border-fp-gray-dark font-body text-sm",
        className,
      )}
      {...rest}
    />
  );
}

export function TabsTrigger({
  className,
  ...rest
}: ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "relative flex h-9 items-center px-3 text-fp-gray-dark transition-colors",
        "data-[state=active]:text-fp-charcoal data-[state=active]:after:absolute data-[state=active]:after:inset-x-0",
        "data-[state=active]:after:-bottom-px data-[state=active]:after:h-0.5 data-[state=active]:after:bg-fp-accent-fill",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fp-teal focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        className,
      )}
      {...rest}
    />
  );
}

export function TabsContent({
  className,
  ...rest
}: ComponentPropsWithoutRef<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn(
        "pt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fp-teal",
        className,
      )}
      {...rest}
    />
  );
}
