import type { ComponentProps, ReactNode } from "react";
import { cn } from "./cn";
import { Spinner } from "./spinner";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "danger-ghost";
export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-control font-semibold whitespace-nowrap transition-colors select-none disabled:cursor-not-allowed aria-busy:cursor-progress [&_svg]:size-[1.125em] [&_svg]:shrink-0";

const VARIANTS: Readonly<Record<ButtonVariant, string>> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary-hover disabled:bg-primary-disabled aria-busy:bg-primary",
  secondary:
    "border border-border bg-surface text-foreground hover:border-border-strong hover:bg-surface-muted disabled:bg-surface-muted disabled:text-muted",
  ghost: "text-primary-text hover:bg-primary-soft disabled:bg-transparent disabled:text-muted",
  danger:
    "bg-danger text-white hover:bg-danger-hover disabled:opacity-50 aria-busy:bg-danger aria-busy:opacity-100",
  "danger-ghost":
    "text-danger-text hover:bg-danger-soft disabled:bg-transparent disabled:opacity-50",
};

const SIZES: Readonly<Record<ButtonSize, string>> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-body",
  lg: "h-12 px-5 text-body",
};

/** Классы кнопки — чтобы оформить ссылку (<Link>) так же, как кнопку. */
export function buttonClassName({
  variant = "primary",
  size = "md",
  className,
}: {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly className?: string;
} = {}): string {
  return cn(BASE, VARIANTS[variant], SIZES[size], className);
}

export type ButtonProps = ComponentProps<"button"> & {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  /** Иконка слева от текста (lucide-react). Во время загрузки её заменяет спиннер. */
  readonly icon?: ReactNode;
  /** Идёт действие: кнопка неактивна, показывает спиннер и loadingText. */
  readonly loading?: boolean;
  /** Текст во время загрузки, например «Создание…». По умолчанию — обычный текст. */
  readonly loadingText?: ReactNode;
};

/**
 * Кнопка из набора компонентов: основная, второстепенная (обводка), текстовая,
 * опасная (красная заливка) и опасная текстовая («Удалить задачу»).
 */
export function Button({
  variant = "primary",
  size = "md",
  icon,
  loading = false,
  loadingText,
  disabled,
  type = "button",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClassName({ variant, size, className })}
      {...props}
    >
      {loading ? <Spinner /> : icon}
      {loading && loadingText !== undefined ? loadingText : children}
    </button>
  );
}
