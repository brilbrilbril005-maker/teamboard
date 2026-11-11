import { cn } from "./cn";

export type LogoSize = "sm" | "md" | "lg";

const SIZES: Readonly<Record<LogoSize, { readonly mark: string; readonly text: string }>> = {
  sm: { mark: "h-6", text: "text-xl" },
  md: { mark: "h-7", text: "text-[1.75rem]" },
  lg: { mark: "h-10", text: "text-[2.5rem]" },
};

/** Знак Teamboard — двое людей. Цвет — currentColor (по умолчанию основной синий). */
export function LogoMark({ className }: { readonly className?: string }) {
  return (
    <svg
      viewBox="0 0 32 24"
      fill="currentColor"
      aria-hidden="true"
      className={cn("text-primary w-auto shrink-0", className)}
    >
      <circle cx="22.5" cy="6.5" r="4" />
      <path d="M15.5 21.5c0-4.6 3.1-7.8 7-7.8s7 3.2 7 7.8c0 .8-.6 1.5-1.4 1.5H16.9c-.8 0-1.4-.7-1.4-1.5Z" />
      <circle cx="10" cy="6" r="5" />
      <path d="M1 21c0-5.3 4-9 9-9s9 3.7 9 9c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2Z" />
    </svg>
  );
}

export type LogoProps = {
  /** full — знак и надпись, mark — только знак (подпись для диктора сохраняется). */
  readonly variant?: "full" | "mark";
  readonly size?: LogoSize;
  readonly className?: string;
};

/** Логотип: синий знак и надпись «Teamboard» цветом текста (в тёмной теме — светлая). */
export function Logo({ variant = "full", size = "md", className }: LogoProps) {
  const sizes = SIZES[size];

  if (variant === "mark") {
    return (
      <span role="img" aria-label="Teamboard" className={cn("inline-flex", className)}>
        <LogoMark className={sizes.mark} />
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={sizes.mark} />
      <span className={cn("text-foreground leading-none font-bold tracking-tight", sizes.text)}>
        Teamboard
      </span>
    </span>
  );
}
