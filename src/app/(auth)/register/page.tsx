import type { Metadata } from "next";
import { AuthSwitchLink } from "@/features/auth/components/auth-switch-link";
import { SignUpForm } from "@/features/auth/components/sign-up-form";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = { title: "Регистрация" };

export default function RegisterPage() {
  return (
    <>
      <div className="flex flex-col gap-6">
        <h1 className="text-h1">Регистрация</h1>
        <SignUpForm />
      </div>
      <AuthSwitchLink question="Уже есть аккаунт?" href={ROUTES.login} label="Войти" />
    </>
  );
}
