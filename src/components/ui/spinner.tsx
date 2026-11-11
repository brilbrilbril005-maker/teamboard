import { cn } from "./cn";

export type SpinnerProps = {
  /** Текст для экранного диктора. Без него индикатор считается украшением (внутри кнопки). */
  readonly label?: string;
  readonly className?: string;
};

/** Крутящееся кольцо загрузки. Размер и цвет — через className (size-4, text-primary). */
export function Spinner({ label, className }: SpinnerProps) {
  const ring = (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn("animate-spin-slow size-4 shrink-0", className)}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );

  if (!label) {
    return ring;
  }
  return (
    <span role="status" className="inline-flex items-center gap-2">
      {ring}
      <span className="sr-only">{label}</span>
    </span>
  );
}
