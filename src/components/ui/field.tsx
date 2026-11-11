"use client";

import { createContext, useContext, useId, type ReactNode } from "react";
import { cn } from "./cn";

type FieldContextValue = {
  readonly controlId: string;
  readonly describedBy: string | undefined;
  readonly invalid: boolean;
  readonly required: boolean;
};

const FieldContext = createContext<FieldContextValue | null>(null);

export type FieldProps = {
  readonly label: ReactNode;
  /** Текст ошибки под полем. Если задан — поле получает aria-invalid и красную обводку. */
  readonly error?: string | null;
  /** Подсказка под полем, например «Минимум 8 символов». */
  readonly hint?: ReactNode;
  readonly required?: boolean;
  /** Свой id поля (по умолчанию создаётся автоматически). */
  readonly id?: string;
  readonly className?: string;
  readonly children: ReactNode;
};

/**
 * Подпись + поле + ошибка/подсказка. Поле внутри (Input, PasswordInput, Textarea,
 * Select, DatePicker) само получает id, aria-invalid и aria-describedby.
 *
 *   <Field label="Название" error={errors.title} required>
 *     <Input name="title" />
 *   </Field>
 */
export function Field({
  label,
  error,
  hint,
  required = false,
  id,
  className,
  children,
}: FieldProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const errorId = `${controlId}-error`;
  const hintId = `${controlId}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ");

  const context: FieldContextValue = {
    controlId,
    describedBy: describedBy || undefined,
    invalid: Boolean(error),
    required,
  };

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={controlId} className="text-foreground text-sm font-semibold">
        {label}
        {required ? (
          <span aria-hidden="true" className="text-danger-text">
            {" "}
            *
          </span>
        ) : null}
      </label>
      <FieldContext value={context}>{children}</FieldContext>
      {error ? (
        <p id={errorId} className="text-caption text-danger-text">
          {error}
        </p>
      ) : null}
      {hint ? (
        <p id={hintId} className="text-caption text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type ControlAttributes = {
  readonly id?: string;
  readonly "aria-describedby"?: string;
  readonly "aria-invalid"?: boolean | "true" | "false" | "grammar" | "spelling";
  readonly required?: boolean;
};

/**
 * Связывает поле с окружающим <Field>. Явно переданные пропсы важнее контекста.
 * Вне <Field> возвращает пропсы как есть (поле можно использовать и без подписи — с aria-label).
 */
export function useFieldControl(props: ControlAttributes & { readonly invalid?: boolean }) {
  const field = useContext(FieldContext);
  const invalid = props.invalid ?? field?.invalid ?? false;
  return {
    id: props.id ?? field?.controlId,
    "aria-describedby": props["aria-describedby"] ?? field?.describedBy,
    "aria-invalid": props["aria-invalid"] ?? (invalid || undefined),
    required: props.required ?? (field?.required || undefined),
  };
}
