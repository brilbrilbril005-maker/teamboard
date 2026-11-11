import type { ReactNode } from "react";
import { cn } from "./cn";

export type EmptyStateProps = {
  /** Картинка над заголовком: <BoardIllustration /> или крупная иконка lucide. */
  readonly illustration?: ReactNode;
  readonly title: string;
  readonly description?: ReactNode;
  /** Кнопка действия: «+ Создать задачу», «Сбросить фильтры». */
  readonly action?: ReactNode;
  readonly className?: string;
};

/** Пустое состояние: «Пока нет ни одной задачи», «По вашему запросу ничего не найдено». */
export function EmptyState({
  illustration,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 px-4 py-12 text-center",
        className,
      )}
    >
      {illustration ? (
        <div
          aria-hidden="true"
          className="text-foreground mb-4 [&>.lucide]:size-16 [&>.lucide]:stroke-[1.5]"
        >
          {illustration}
        </div>
      ) : null}
      <h2 className="text-h2 max-w-md text-balance">{title}</h2>
      {description ? <p className="text-body text-muted max-w-md">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

/** Рисунок для пустой доски: три колонки и синий «+». */
export function BoardIllustration({ className }: { readonly className?: string }) {
  return (
    <svg
      viewBox="0 0 200 120"
      fill="none"
      aria-hidden="true"
      className={cn("h-28 w-auto", className)}
    >
      <path
        d="M150 14l4-9M160 22l9-6M163 34h10"
        stroke="var(--color-muted)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <rect
        x="30"
        y="20"
        width="120"
        height="80"
        rx="8"
        fill="var(--color-surface)"
        stroke="var(--color-border-strong)"
        strokeWidth="3"
      />
      <path d="M30 34h120M70 34v66M110 34v66" stroke="var(--color-border-strong)" strokeWidth="3" />
      <rect x="38" y="44" width="24" height="6" rx="3" fill="var(--color-border)" />
      <rect x="78" y="44" width="24" height="6" rx="3" fill="var(--color-border)" />
      <rect x="118" y="44" width="24" height="6" rx="3" fill="var(--color-border)" />
      <rect x="38" y="56" width="24" height="16" rx="3" fill="var(--color-primary-soft)" />
      <rect x="78" y="56" width="24" height="16" rx="3" fill="var(--color-primary-soft)" />
      <rect x="118" y="56" width="24" height="16" rx="3" fill="var(--color-primary-soft)" />
      <circle cx="148" cy="96" r="17" fill="var(--color-primary)" />
      <path
        d="M148 88v16M140 96h16"
        stroke="var(--color-primary-foreground)"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
