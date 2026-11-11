"use client";

import { Check, ChevronDown } from "lucide-react";
import { Select as SelectPrimitive } from "radix-ui";
import type { ReactNode } from "react";
import { cn } from "./cn";
import { CONTROL_CLASS_NAME, CONTROL_HEIGHT_CLASS_NAME } from "./control-styles";
import { useFieldControl } from "./field";

export type SelectOption<Value extends string = string> = {
  readonly value: Value;
  readonly label: string;
  /** Иконка или аватар перед текстом (статус, точка приоритета, буква участника). */
  readonly icon?: ReactNode;
  readonly disabled?: boolean;
};

export type SelectProps<Value extends string> = {
  readonly options: readonly SelectOption<Value>[];
  readonly value?: Value;
  readonly defaultValue?: Value;
  readonly onValueChange?: (value: Value) => void;
  readonly placeholder?: string;
  /** Иконка в незаполненном поле (например, человек у «Ответственный»). */
  readonly placeholderIcon?: ReactNode;
  /** Имя для отправки в форме: Radix создаёт скрытый <select>. */
  readonly name?: string;
  readonly id?: string;
  readonly disabled?: boolean;
  readonly required?: boolean;
  readonly invalid?: boolean;
  readonly className?: string;
  readonly "aria-label"?: string;
  readonly "aria-describedby"?: string;
};

/**
 * Выпадающий список с иконками или аватарами в пунктах (статус, ответственный, приоритет).
 * Доступен с клавиатуры (стрелки, поиск по первым буквам), работает внутри <Field>.
 * Пустое значение Radix не поддерживает: для «Не назначен» используйте своё значение, например "none".
 */
export function Select<Value extends string>({
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder,
  placeholderIcon,
  name,
  id,
  disabled,
  required,
  invalid,
  className,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
}: SelectProps<Value>) {
  const control = useFieldControl({ id, required, invalid, "aria-describedby": ariaDescribedBy });

  const handleChange = (raw: string) => {
    const option = options.find((candidate) => candidate.value === raw);
    if (option) {
      onValueChange?.(option.value);
    }
  };

  return (
    <SelectPrimitive.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={handleChange}
      name={name}
      disabled={disabled}
      required={control.required}
    >
      <SelectPrimitive.Trigger
        id={control.id}
        aria-label={ariaLabel}
        aria-describedby={control["aria-describedby"]}
        aria-invalid={control["aria-invalid"]}
        className={cn(
          CONTROL_CLASS_NAME,
          CONTROL_HEIGHT_CLASS_NAME,
          "data-placeholder:text-muted flex cursor-pointer items-center justify-between gap-2 px-3 text-left",
          className,
        )}
      >
        <span className="flex min-w-0 items-center gap-2 truncate [&_svg]:size-5 [&_svg]:shrink-0">
          <SelectPrimitive.Value
            placeholder={
              <span className="flex items-center gap-2">
                {placeholderIcon}
                {placeholder}
              </span>
            }
          />
        </span>
        <SelectPrimitive.Icon className="text-muted shrink-0">
          <ChevronDown className="size-4" aria-hidden="true" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className="animate-pop-in rounded-card border-border bg-surface text-foreground shadow-popover z-50 max-h-(--radix-select-content-available-height) min-w-(--radix-select-trigger-width) overflow-hidden border"
        >
          <SelectPrimitive.Viewport className="p-1">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className="rounded-control text-body data-highlighted:bg-surface-muted data-[state=checked]:bg-primary-soft relative flex h-10 cursor-pointer items-center gap-2.5 pr-9 pl-2.5 outline-none select-none data-disabled:cursor-not-allowed data-disabled:opacity-50 [&_svg]:size-5 [&_svg]:shrink-0"
              >
                <SelectPrimitive.ItemText>
                  <span className="flex items-center gap-2">
                    {option.icon}
                    {option.label}
                  </span>
                </SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="text-primary-text absolute right-2.5 flex">
                  <Check aria-hidden="true" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
