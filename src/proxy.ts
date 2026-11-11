import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE_PREFIX } from "@/features/auth/model";
import { PUBLIC_ROUTES, ROUTES } from "@/lib/routes";

/**
 * Быстрая предварительная проверка: есть ли cookie сессии.
 * Это только удобство (сразу отправить гостя на вход) — подлинность сессии
 * здесь не проверяется. Настоящая проверка всегда происходит на сервере:
 * requireUser() для страниц и authedAction() для действий.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSessionCookie = Boolean(getSessionCookie(request, { cookiePrefix: AUTH_COOKIE_PREFIX }));
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  if (!hasSessionCookie && !isPublicRoute) {
    return NextResponse.redirect(new URL(ROUTES.login, request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Всё, кроме служебных адресов Next.js, проверки здоровья и статических файлов.
  // Расширения перечислены явно: адрес вида /tasks/отчёт.v2 не должен обходить проверку.
  matcher: [
    "/((?!api/health$|_next/static|_next/image|favicon\\.ico$|.*\\.(?:png|jpg|jpeg|svg|webp|ico|woff2|txt|xml|webmanifest)$).*)",
  ],
};
