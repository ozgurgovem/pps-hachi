import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes, Ref } from "react";
import { cn } from "./cn";

/** Farplas görsel diline taşındı (P-58/D-25x, Grup 3) — bkz. Input.tsx'in kendi notu. */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-body font-medium " +
    "cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 " +
    "focus-visible:ring-fp-teal focus-visible:ring-offset-2 focus-visible:ring-offset-surface " +
    "disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-fp-accent-fill text-fp-accent-fill-ink hover:brightness-110 rounded-lg",
        secondary: "border border-fp-gray-dark text-fp-charcoal hover:bg-surface-raised rounded-lg",
        ghost: "text-fp-charcoal hover:bg-surface-raised rounded-lg",
      },
      size: {
        default: "h-9 px-4 text-sm",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { ref?: Ref<HTMLButtonElement> };

export function Button({ className, variant, size, type = "button", ref, ...rest }: ButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...rest}
    />
  );
}
