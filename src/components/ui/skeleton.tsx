import { cn } from "./cn";

/** Серая заглушка на месте загружаемого содержимого. Размер — через className. */
export function Skeleton({ className }: { readonly className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-skeleton bg-surface-muted rounded-md", className)}
    />
  );
}
