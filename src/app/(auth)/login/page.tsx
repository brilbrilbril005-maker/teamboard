import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DemoSignInButton } from "@/features/auth/components/session-buttons";
import { SignInForm } from "@/features/auth/components/sign-in-form";
import { isDemoSignInEnabled } from "@/features/auth/server/queries";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = { title: "Вход" };

/** Кнопка появляется, только если на сервере задан пароль демо-аккаунта. */
async function DemoSignIn() {
  return (await isDemoSignInEnabled()) ? <DemoSignInButton /> : null;
}

export default function LoginPage() {
  return (
    <>
      <SignInForm />
      <Suspense fallback={null}>
        <DemoSignIn />
      </Suspense>
      <p>
        Нет аккаунта? <Link href={ROUTES.register}>Зарегистрироваться</Link>
      </p>
    </>
  );
}
