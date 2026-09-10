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

/**
 * Real gap found in Barış's own first trial run (2026-09-10): the AI model
 * pickers (dozens of real Vorion-listed models) rendered with no height cap
 * at all — the popup just grew to fit every item, spilling off both edges of
 * the screen with nothing to scroll it into view. `SelectContent` never
 * consumed Radix's own `--radix-select-content-available-height` CSS
 * variable (confirmed by reading `@radix-ui/react-select`'s real source,
 * `dist/index.js` — it sets this custom property on the Content element
 * itself), so the popup had no reason to ever become scrollable.
 * `SelectPrimitive.Viewport` already sets `overflow: "hidden auto"` as its
 * own default inline style (same source, confirmed) — capping Content's own
 * height is the one missing piece. `ScrollUpButton`/`ScrollDownButton` add
 * the visible affordance Radix's own docs pair with this — without them, a
 * capped-but-scrollable list still looks like the classic hidden-scrollbar
 * pattern that Radix intentionally applies here (Viewport's default CSS
 * hides the native scrollbar), giving no visual hint that scrolling works.
 */
export function SelectContent({ children, ...rest }: SelectContentProps) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        className="z-50 max-h-[var(--radix-select-content-available-height)] overflow-hidden rounded-control border border-border bg-surface-raised text-ink shadow-lg"
        position="popper"
        sideOffset={4}
        {...rest}
      >
        <SelectPrimitive.ScrollUpButton className="flex h-6 cursor-default items-center justify-center bg-surface-raised text-ink-muted">
          <ChevronIcon direction="up" />
        </SelectPrimitive.ScrollUpButton>
        <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
        <SelectPrimitive.ScrollDownButton className="flex h-6 cursor-default items-center justify-center bg-surface-raised text-ink-muted">
          <ChevronIcon direction="down" />
        </SelectPrimitive.ScrollDownButton>
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

function ChevronIcon({ direction = "down" }: { direction?: "up" | "down" }) {
  return (
    <svg
      width="10"
      height="6"
      viewBox="0 0 10 6"
      fill="none"
      aria-hidden="true"
      className={direction === "up" ? "rotate-180" : undefined}
    >
      <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
