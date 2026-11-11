import "server-only";
import { connection } from "next/server";
import { getAuthService } from "./index";

/** Показывать ли кнопку «Войти как демо». Настройка читается при запросе, а не во время сборки. */
export async function isDemoSignInEnabled(): Promise<boolean> {
  await connection();
  return getAuthService().isDemoEnabled();
}
