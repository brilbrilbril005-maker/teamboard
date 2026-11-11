"use client";

import { signInAction } from "../server/actions";
import { useAuthForm } from "./use-auth-form";

const FIELDS = ["username", "password"] as const;

/** Временная форма без оформления — визуальная часть делается по макетам отдельно. */
export function SignInForm() {
  const { error, submit, isPending, formRef } = useAuthForm(FIELDS, signInAction);

  return (
    <form ref={formRef} action={submit} className="flex flex-col gap-3" noValidate>
      <label className="flex flex-col gap-1">
        Логин
        <input name="username" autoComplete="username" autoCapitalize="none" required className="border p-2" />
      </label>
      <label className="flex flex-col gap-1">
        Пароль
        <input name="password" type="password" autoComplete="current-password" required className="border p-2" />
      </label>
      {error ? <p role="alert">{error.message}</p> : null}
      <button type="submit" disabled={isPending} className="border p-2">
        {isPending ? "Входим…" : "Войти"}
      </button>
    </form>
  );
}
