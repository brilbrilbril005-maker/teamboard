"use client";

import { useActionState, useEffect, useLayoutEffect, useRef } from "react";
import type { ActionError, ActionResult } from "@/lib/result";

type FormValues<Fields extends string> = Readonly<Partial<Record<Fields, string>>>;

type AuthFormState<Fields extends string> = {
  readonly error: ActionError | null;
  /** Что ввёл пользователь — чтобы после ошибки не набирать заново (кроме пароля). */
  readonly values: FormValues<Fields>;
};

function readValues<Fields extends string>(
  formData: FormData,
  fields: readonly Fields[],
): Record<Fields, string> {
  return Object.fromEntries(
    fields.map((field) => {
      const value = formData.get(field);
      return [field, typeof value === "string" ? value : ""];
    }),
  ) as Record<Fields, string>;
}

function pickValues<Fields extends string>(
  values: Record<Fields, string>,
  fields: readonly Fields[],
): FormValues<Fields> {
  return Object.fromEntries(fields.map((field) => [field, values[field]])) as FormValues<Fields>;
}

export type UseAuthFormOptions<Fields extends string> = {
  /**
   * Поля, которые остаются заполненными после ошибки. React очищает неуправляемые
   * поля после действия, поэтому их значения возвращаются через defaultValue.
   * Пароль сюда не включать: он не должен храниться дольше одной попытки.
   */
  readonly preserve?: readonly Fields[];
};

/**
 * Связывает форму с серверным действием: собирает значения полей,
 * вызывает действие и хранит последнюю ошибку и признак «идёт отправка».
 */
export function useAuthForm<Fields extends string>(
  fields: readonly Fields[],
  action: (values: Record<Fields, string>) => Promise<ActionResult<unknown>>,
  { preserve = [] }: UseAuthFormOptions<Fields> = {},
) {
  const [state, submit, isPending] = useActionState<AuthFormState<Fields>, FormData>(
    async (_previous, formData) => {
      const values = readValues(formData, fields);
      const result = await action(values);
      return { error: result.ok ? null : result.error, values: pickValues(values, preserve) };
    },
    { error: null, values: {} as FormValues<Fields> },
  );

  // Next.js не удаляет страницу при переходе, а прячет её. Очищаем форму в этот
  // момент, чтобы введённый пароль не оставался в скрытой странице.
  const formRef = useRef<HTMLFormElement>(null);
  useLayoutEffect(() => {
    const form = formRef.current;
    return () => form?.reset();
  }, []);

  // После ошибки в полях переводим фокус на первое неверное поле.
  useEffect(() => {
    if (state.error?.fieldErrors) {
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    }
  }, [state.error]);

  return { error: state.error, values: state.values, submit, isPending, formRef };
}
