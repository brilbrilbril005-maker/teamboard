"use client";

import { useActionState, useLayoutEffect, useRef } from "react";
import type { ActionError, ActionResult } from "@/lib/result";

type FormValues = Readonly<Record<string, string>>;

function readValues(formData: FormData, fields: readonly string[]): FormValues {
  return Object.fromEntries(
    fields.map((field) => {
      const value = formData.get(field);
      return [field, typeof value === "string" ? value : ""];
    }),
  );
}

/**
 * Связывает форму с серверным действием: собирает значения полей,
 * вызывает действие и хранит последнюю ошибку и признак «идёт отправка».
 */
export function useAuthForm<Fields extends string>(
  fields: readonly Fields[],
  action: (values: Record<Fields, string>) => Promise<ActionResult<unknown>>,
) {
  const [error, submit, isPending] = useActionState<ActionError | null, FormData>(
    async (_previous, formData) => {
      const result = await action(readValues(formData, fields) as Record<Fields, string>);
      return result.ok ? null : result.error;
    },
    null,
  );

  // Next.js не удаляет страницу при переходе, а прячет её. Очищаем форму в этот
  // момент, чтобы введённый пароль не оставался в скрытой странице.
  const formRef = useRef<HTMLFormElement>(null);
  useLayoutEffect(() => {
    const form = formRef.current;
    return () => form?.reset();
  }, []);

  return { error, submit, isPending, formRef };
}
