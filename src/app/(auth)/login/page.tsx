import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthSwitchLink } from "@/features/auth/components/auth-switch-link";
import { DemoSignInButton } from "@/features/auth/components/session-buttons";
import { SignInForm } from "@/features/auth/components/sign-in-form";
import { isDemoSignInEnabled } from "@/features/auth/server/queries";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = { title: "Вход" };

/** Разделитель «или» и кнопка демо-входа — только если на сервере задан пароль демо-аккаунта. */
async function DemoSignIn() {
  if (!(await isDemoSignInEnabled())) {
    return null;
  }
  return (
    <div className="flex flex-col gap-5">
      <div className="text-muted flex items-center gap-4 text-sm" aria-hidden="true">
        <span className="bg-border h-px flex-1" />
        или
        <span className="bg-border h-px flex-1" />
      </div>
      <DemoSignInButton />
    </div>
  );
}

export default function LoginPage() {
  return (
    <>
      <div className="flex flex-col gap-6">
        <h1 className="text-h1">Вход в команду</h1>
        <SignInForm />
        <Suspense fallback={null}>
          <DemoSignIn />
        </Suspense>
      </div>
      <AuthSwitchLink question="Нет аккаунта?" href={ROUTES.register} label="Зарегистрироваться" />
    </>
  );
}
