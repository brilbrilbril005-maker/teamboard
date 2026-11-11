import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Logo } from "@/components/ui/logo";
import { getCurrentUser } from "@/features/auth/server/session";
import { ROUTES } from "@/lib/routes";

/** Уже вошедшего пользователя со страниц входа и регистрации отправляем в приложение. */
async function RedirectSignedInUser() {
  if (await getCurrentUser()) {
    redirect(ROUTES.home);
  }
  return null;
}

/**
 * Вход и регистрация: карточка по центру экрана. На телефоне карточки нет —
 * форма занимает весь экран на белом фоне, как в макете.
 */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="bg-surface sm:bg-background flex min-h-dvh justify-center px-4 py-10 sm:items-center sm:py-16">
      <Suspense fallback={null}>
        <RedirectSignedInUser />
      </Suspense>
      <div className="sm:rounded-dialog sm:border-border sm:bg-surface sm:shadow-card flex w-full max-w-[27rem] flex-col gap-8 sm:border sm:px-10 sm:py-10">
        <Logo size="lg" className="self-center" />
        {children}
      </div>
    </main>
  );
}
