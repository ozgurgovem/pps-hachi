import * as DialogPrimitive from "radix-ui/dialog";
import type { ReactNode } from "react";
import { cn } from "./cn";

export const DialogRoot = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

interface DialogContentProps {
  className?: string;
  children: ReactNode;
  title: string;
  description?: string;
}

/**
 * `max-h-[85vh]` + the title/description staying `shrink-0` while only the
 * body scrolls: content that grows with the user's data (Fishbone's cause
 * list, a long row table) must never push the Title or the Save/Cancel row
 * off-screen with no way to reach them. No caller had content tall enough to
 * hit this until Phase 6b's tree/graph methods — found walking the real app
 * (Anayasa §3b: "yürütülmemiş yol").
 */
export function DialogContent({ className, children, title, description }: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/40" />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 flex max-h-[85vh] w-full max-w-md -translate-x-1/2 -translate-y-1/2",
          "flex-col rounded-control border border-border bg-surface p-6 shadow-lg",
          className,
        )}
      >
        <DialogPrimitive.Title className="shrink-0 font-display text-xl font-semibold tracking-wide text-ink">
          {title}
        </DialogPrimitive.Title>
        {description ? (
          <DialogPrimitive.Description className="mt-1 shrink-0 font-body text-sm text-ink-muted">
            {description}
          </DialogPrimitive.Description>
        ) : null}
        <div className="mt-4 overflow-y-auto">{children}</div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
