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

export function DialogContent({ className, children, title, description }: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/40" />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2",
          "rounded-control border border-border bg-surface p-6 shadow-lg",
          className,
        )}
      >
        <DialogPrimitive.Title className="font-display text-xl font-semibold tracking-wide text-ink">
          {title}
        </DialogPrimitive.Title>
        {description ? (
          <DialogPrimitive.Description className="mt-1 font-body text-sm text-ink-muted">
            {description}
          </DialogPrimitive.Description>
        ) : null}
        <div className="mt-4">{children}</div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
