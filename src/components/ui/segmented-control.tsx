"use client";

import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";
import type { ReactNode } from "react";
import { cn } from "./cn";

export type SegmentedOption<Value extends string> = {
  readonly value: Value;
  readonly label: ReactNode;
  readonly icon?: ReactNode;
  /** Подпись для диктора, если вместо текста только иконка. */
  readonly ariaLabel?: string;
};

export type SegmentedControlProps<Value extends string> = {
  readonly options: readonly SegmentedOption<Value>[];
  readonly value: Value;
  readonly onValueChange: (value: Value) => void;
  /** Что переключаем: «Вид задач». */
  readonly "aria-label": string;
  /** solid — синяя заливка («Доска | Список»), soft — голубая (тема). */
  readonly variant?: "solid" | "soft";
  readonly size?: "sm" | "md";
  readonly className?: string;
};

const ACTIVE: Readonly<Record<"solid" | "soft", string>> = {
  solid: "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground",
  soft: "data-[state=on]:bg-primary-soft data-[state=on]:text-primary-text",
};

/**
 * Переключатель из нескольких вариантов, один всегда выбран («Доска | Список»).
 * Стрелки влево/вправо переходят между вариантами.
 */
export function SegmentedControl<Value extends string>({
  options,
  value,
  onValueChange,
  "aria-label": ariaLabel,
  variant = "solid",
  size = "md",
  className,
}: SegmentedControlProps<Value>) {
  const handleChange = (raw: string) => {
    // Повторный клик по выбранному варианту Radix сообщает пустой строкой — игнорируем.
    const option = options.find((candidate) => candidate.value === raw);
    if (option) {
      onValueChange(option.value);
    }
  };

  return (
    <ToggleGroupPrimitive.Root
      type="single"
      value={value}
      onValueChange={handleChange}
      aria-label={ariaLabel}
      className={cn(
        "rounded-control border-border bg-surface inline-flex shrink-0 items-center gap-0.5 border p-0.5",
        className,
      )}
    >
      {options.map((option) => (
        <ToggleGroupPrimitive.Item
          key={option.value}
          value={option.value}
          aria-label={option.ariaLabel}
          className={cn(
            "text-foreground hover:bg-surface-muted inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-[calc(var(--radius-control)-2px)] font-medium transition-colors [&_svg]:size-5 [&_svg]:shrink-0",
            size === "md" ? "text-body h-9 px-4" : "h-7 px-3 text-sm",
            ACTIVE[variant],
          )}
        >
          {option.icon}
          {option.label}
        </ToggleGroupPrimitive.Item>
      ))}
    </ToggleGroupPrimitive.Root>
  );
}
