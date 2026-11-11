"use client";

import type { ComponentProps } from "react";
import { cn } from "./cn";
import { CONTROL_CLASS_NAME } from "./control-styles";
import { useFieldControl } from "./field";

export type TextareaProps = ComponentProps<"textarea"> & {
  readonly invalid?: boolean;
};

/** Многострочное поле (описание задачи). Высота меняется только по вертикали. */
export function Textarea({
  invalid,
  className,
  id,
  required,
  rows = 3,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  ...props
}: TextareaProps) {
  const control = useFieldControl({
    id,
    required,
    invalid,
    "aria-describedby": ariaDescribedBy,
    "aria-invalid": ariaInvalid,
  });

  return (
    <textarea
      {...control}
      {...props}
      rows={rows}
      className={cn(CONTROL_CLASS_NAME, "min-h-20 resize-y px-3 py-2", className)}
    />
  );
}
