import type { ComponentProps, ReactNode } from "react";
import { cn } from "./cn";

export type IconButtonVariant = "ghost" | "secondary" | "soft";
export type IconButtonSize = "sm" | "md" | "lg";

const VARIANTS: Readonly<Record<IconButtonVariant, string>> = {
  ghost: "text-muted hover:bg-surface-muted hover:text-foreground",
  secondary:
    "border border-border bg-surface text-foreground hover:border-border-strong hover:bg-surface-muted",
  soft: "bg-primary-soft text-primary-text hover:bg-primary-soft/80",
};

const SIZES: Readonly<Record<IconButtonSize, string>> = {
  sm: "size-8 [&_svg]:size-4",
  md: "size-10 [&_svg]:size-5",
  lg: "size-12 [&_svg]:size-6",
};

export type IconButtonProps = Omit<ComponentProps<"button">, "aria-label" | "children"> & {
  /** Обязательная подпись: у кнопки нет текста, диктор прочитает её. */
  readonly label: string;
  readonly icon: ReactNode;
  readonly variant?: IconButtonVariant;
  readonly size?: IconButtonSize;
};

/** Квадратная кнопка-иконка: «⋯» на карточке, крестик окна, поиск в мобильной шапке. */
export function IconButton({
  label,
  icon,
  variant = "ghost",
  size = "md",
  type = "button",
  className,
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cn(
        "rounded-control inline-flex shrink-0 cursor-pointer items-center justify-center transition-colors disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:shrink-0",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {icon}
    </button>
  );
}
