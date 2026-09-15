import type { TextareaHTMLAttributes } from "react";
import { cn } from "./cn";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

/** Farplas görsel diline taşındı (P-58/D-25x, Grup 1) — bkz. Input.tsx'in kendi notu. */
export function Textarea({ className, ...rest }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full rounded-lg border border-fp-gray-dark bg-surface px-3 py-2 font-body text-sm text-fp-charcoal",
        "placeholder:text-fp-gray-dark",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fp-teal focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...rest}
    />
  );
}
