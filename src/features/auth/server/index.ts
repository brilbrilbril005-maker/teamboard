import "server-only";
import { getDb } from "@/db/client";
import type { Database } from "@/db/types";
import { getEnv } from "@/lib/server/env";
import { createRateLimiter } from "@/lib/server/rate-limit";
import { createAuth, type Auth } from "./auth";
import { createAuthService, type AuthService } from "./service";

/**
 * Сборка модуля авторизации для работы приложения: здесь зависимости
 * (база, настройки) соединяются с сервисом. В тестах сервис собирается
 * так же, но с базой в памяти.
 */

/** Авторизация поверх указанного подключения (например, внутри транзакции). */
export function createAuthFor(db: Database): Auth {
  const env = getEnv();
  return createAuth({ db, secret: env.AUTH_SECRET, baseUrl: env.APP_URL });
}

let authService: AuthService | undefined;

export function getAuthService(): AuthService {
  const db = getDb();
  authService ??= createAuthService({
    auth: createAuthFor(db),
    rateLimiter: createRateLimiter(db),
    demoPassword: getEnv().DEMO_PASSWORD,
  });
  return authService;
}
