import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { ROUTES } from "@/lib/routes";
import type { CurrentUser } from "../model";
import { getAuthService } from "./index";

/**
 * Единственный способ узнать, кто сейчас вошёл. Результат запоминается
 * на время одного запроса, поэтому повторные вызовы не ходят в базу.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  return getAuthService().getCurrentUser(await headers());
});

/** Для страниц и чтения данных: без входа отправляет на страницу входа. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(ROUTES.login);
  }
  return user;
}
