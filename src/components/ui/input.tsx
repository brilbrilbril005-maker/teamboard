"use client";

import type { ComponentProps, ReactNode } from "react";
import { cn } from "./cn";
import { CONTROL_CLASS_NAME, CONTROL_HEIGHT_CLASS_NAME } from "./control-styles";
import { useFieldControl } from "./field";

export type InputProps = ComponentProps<"input"> & {
  /** Иконка слева (lucide-react): человек у логина, лупа у поиска. */
  readonly icon?: ReactNode;
  /** Элемент справа внутри поля: кнопка «показать пароль», крестик очистки. */
  readonly endSlot?: ReactNode;
  /** Ошибка без <Field> (внутри <Field> берётся из него). */
  readonly invalid?: boolean;
  /** Классы внешней обёртки (ширина поля в панели инструментов и т. п.). */
  readonly containerClassName?: string;
};

export function Input({
  icon,
  endSlot,
  invalid,
  className,
  containerClassName,
  id,
  required,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  ...props
}: InputProps) {
  const control = useFieldControl({
    id,
    required,
    invalid,
    "aria-describedby": ariaDescribedBy,
    "aria-invalid": ariaInvalid,
  });

  return (
    <div className={cn("relative flex items-center", containerClassName)}>
      {icon ? (
        <span
          aria-hidden="true"
          className="text-muted pointer-events-none absolute left-3 flex [&_svg]:size-5"
        >
          {icon}
        </span>
      ) : null}
      <input
        {...control}
        {...props}
        className={cn(
          CONTROL_CLASS_NAME,
          CONTROL_HEIGHT_CLASS_NAME,
          "px-3",
          icon ? "pl-10" : null,
          endSlot ? "pr-11" : null,
          className,
        )}
      />
      {endSlot ? <span className="absolute right-1 flex">{endSlot}</span> : null}
    </div>
  );
}
