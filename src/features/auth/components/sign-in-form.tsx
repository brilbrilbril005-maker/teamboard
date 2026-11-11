"use client";

import { UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { signInAction } from "../server/actions";
import { FormError } from "./form-error";
import { useAuthForm } from "./use-auth-form";

const FIELDS = ["username", "password"] as const;
const PRESERVED = ["username"] as const;

export function SignInForm() {
  const { error, values, submit, isPending, formRef } = useAuthForm(FIELDS, signInAction, {
    preserve: PRESERVED,
  });
  const fieldError = (field: (typeof FIELDS)[number]) => error?.fieldErrors?.[field]?.[0];

  return (
    <form ref={formRef} action={submit} className="flex flex-col gap-5" noValidate>
      <Field label="Логин" error={fieldError("username")}>
        <Input
          name="username"
          icon={<UserRound />}
          defaultValue={values.username}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
      </Field>
      <Field label="Пароль" error={fieldError("password")}>
        <PasswordInput name="password" autoComplete="current-password" />
      </Field>
      {error && !error.fieldErrors ? <FormError message={error.message} /> : null}
      <Button type="submit" size="lg" loading={isPending} loadingText="Входим…" className="mt-1">
        Войти
      </Button>
    </form>
  );
}
