import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentUser } from "@/features/auth/server/session";
import { ROUTES } from "@/lib/routes";

/** Уже вошедшего пользователя со страниц входа и регистрации отправляем в приложение. */
async function RedirectSignedInUser() {
  if (await getCurrentUser()) {
    redirect(ROUTES.home);
  }
  return null;
}

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-4 p-4">
      <Suspense fallback={null}>
        <RedirectSignedInUser />
      </Suspense>
      <h1 className="text-2xl font-semibold">Teamboard</h1>
      {children}
    </main>
  );
}
