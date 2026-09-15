import type { InputHTMLAttributes } from "react";
import { cn } from "./cn";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

/**
 * Farplas görsel diline taşındı (P-58/D-25x, Grup 1) — D-218/W1'in iniş
 * görünümü + adım sayfası çerçevesinde onayladığı token'lar artık burada da:
 * `rounded-lg` (D-218 Tur 2'nin "web arayüzü gibi" isteği, D-49'un 6px
 * `--radius-control`'ünden daha yumuşak), `border-fp-gray-dark` (P-68 fix —
 * işlevsel/etkileşimli bir sınır, salt dekoratif `fp-gray-light` DEĞİL).
 */
export function Input({ className, ...rest }: InputProps) {
  return (
    <input
      className={cn(
        "h-9 w-full rounded-lg border border-fp-gray-dark bg-surface px-3 font-body text-sm text-fp-charcoal",
        "placeholder:text-fp-gray-dark",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fp-teal focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...rest}
    />
  );
}
