import { X } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "./cn";

const CHIP_BASE =
  "inline-flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-control px-3 text-sm font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0";

export type FilterChipProps = Omit<ComponentProps<"button">, "children" | "onClick"> & {
  /** Текст чипа: «Ответственный: Анна С.». */
  readonly label: string;
  readonly onRemove: () => void;
};

/** Активный фильтр с крестиком: нажатие снимает фильтр. */
export function FilterChip({
  label,
  onRemove,
  className,
  type = "button",
  ...props
}: FilterChipProps) {
  return (
    <button
      type={type}
      onClick={onRemove}
      aria-label={`Убрать фильтр «${label}»`}
      className={cn(
        CHIP_BASE,
        "bg-primary text-primary-foreground hover:bg-primary-hover",
        className,
      )}
      {...props}
    >
      <span className="truncate">{label}</span>
      <X aria-hidden="true" />
    </button>
  );
}

export type ToggleChipProps = Omit<ComponentProps<"button">, "onClick"> & {
  readonly pressed: boolean;
  readonly onPressedChange: (pressed: boolean) => void;
  readonly icon?: ReactNode;
};

/**
 * Кнопка-чип с состоянием «включено» (aria-pressed): «Просроченные», «Мои задачи»,
 * варианты в мобильных фильтрах. Включённый — синий, выключенный — с обводкой.
 */
export function ToggleChip({
  pressed,
  onPressedChange,
  icon,
  className,
  children,
  type = "button",
  ...props
}: ToggleChipProps) {
  return (
    <button
      type={type}
      aria-pressed={pressed}
      onClick={() => onPressedChange(!pressed)}
      className={cn(
        CHIP_BASE,
        pressed
          ? "bg-primary text-primary-foreground hover:bg-primary-hover"
          : "border-border bg-surface text-foreground hover:border-border-strong hover:bg-surface-muted border",
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
