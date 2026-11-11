import type { Metadata } from "next";
import Link from "next/link";
import { SignUpForm } from "@/features/auth/components/sign-up-form";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = { title: "Регистрация" };

export default function RegisterPage() {
  return (
    <>
      <SignUpForm />
      <p>
        Уже есть аккаунт? <Link href={ROUTES.login}>Войти</Link>
      </p>
    </>
  );
}
