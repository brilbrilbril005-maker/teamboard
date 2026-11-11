"use client";

import { AtSign, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { PASSWORD_MIN_LENGTH } from "../model";
import { signUpAction } from "../server/actions";
import { FormError } from "./form-error";
import { useAuthForm } from "./use-auth-form";

const FIELDS = ["username", "name", "password"] as const;
const PRESERVED = ["username", "name"] as const;

export function SignUpForm() {
  const { error, values, submit, isPending, formRef } = useAuthForm(FIELDS, signUpAction, {
    preserve: PRESERVED,
  });
  const fieldError = (field: (typeof FIELDS)[number]) => error?.fieldErrors?.[field]?.[0];

  return (
    <form ref={formRef} action={submit} className="flex flex-col gap-5" noValidate>
      <Field label="Имя" error={fieldError("name")}>
        <Input
          name="name"
          icon={<UserRound />}
          defaultValue={values.name}
          autoComplete="name"
          placeholder="Например, Анна Смирнова"
        />
      </Field>
      <Field label="Логин" error={fieldError("username")}>
        <Input
          name="username"
          icon={<AtSign />}
          defaultValue={values.username}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
      </Field>
      <Field
        label="Пароль"
        error={fieldError("password")}
        hint={`Минимум ${PASSWORD_MIN_LENGTH} символов`}
      >
        <PasswordInput name="password" autoComplete="new-password" />
      </Field>
      {error && !error.fieldErrors ? <FormError message={error.message} /> : null}
      <Button
        type="submit"
        size="lg"
        loading={isPending}
        loadingText="Создание аккаунта…"
        className="mt-1"
      >
        Создать аккаунт
      </Button>
    </form>
  );
}
