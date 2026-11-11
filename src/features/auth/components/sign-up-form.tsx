"use client";

import { signUpAction } from "../server/actions";
import { useAuthForm } from "./use-auth-form";

const FIELDS = ["username", "name", "password"] as const;

/** Временная форма без оформления — визуальная часть делается по макетам отдельно. */
export function SignUpForm() {
  const { error, submit, isPending, formRef } = useAuthForm(FIELDS, signUpAction);
  const fieldError = (field: (typeof FIELDS)[number]) => error?.fieldErrors?.[field]?.[0];

  return (
    <form ref={formRef} action={submit} className="flex flex-col gap-3" noValidate>
      <label className="flex flex-col gap-1">
        Логин
        <input
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          required
          className="border p-2"
        />
        {fieldError("username") ? <span role="alert">{fieldError("username")}</span> : null}
      </label>
      <label className="flex flex-col gap-1">
        Имя
        <input name="name" autoComplete="name" required className="border p-2" />
        {fieldError("name") ? <span role="alert">{fieldError("name")}</span> : null}
      </label>
      <label className="flex flex-col gap-1">
        Пароль
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          required
          className="border p-2"
        />
        {fieldError("password") ? <span role="alert">{fieldError("password")}</span> : null}
      </label>
      {error && !error.fieldErrors ? <p role="alert">{error.message}</p> : null}
      <button type="submit" disabled={isPending} className="border p-2">
        {isPending ? "Создаём аккаунт…" : "Зарегистрироваться"}
      </button>
    </form>
  );
}
