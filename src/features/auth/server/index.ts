import "server-only";
import { getDb } from "@/db/client";
import { getEnv } from "@/lib/server/env";
import { createRateLimiter } from "@/lib/server/rate-limit";
import { createAuth, type Auth } from "./auth";
import { createAuthService, type AuthService } from "./service";

/**
 * Сборка модуля авторизации для работы приложения: здесь зависимости
 * (база, настройки) соединяются с сервисом. В тестах сервис собирается
 * так же, но с базой в памяти.
 */

const globalStore = globalThis as typeof globalThis & {
  __teamboardAuth?: Auth;
};

export function getAuth(): Auth {
  if (!globalStore.__teamboardAuth) {
    const env = getEnv();
    globalStore.__teamboardAuth = createAuth({
      db: getDb(),
      secret: env.AUTH_SECRET,
      baseUrl: env.APP_URL,
    });
  }
  return globalStore.__teamboardAuth;
}

let authService: AuthService | undefined;

export function getAuthService(): AuthService {
  authService ??= createAuthService({
    auth: getAuth(),
    rateLimiter: createRateLimiter(getDb()),
    demoPassword: getEnv().DEMO_PASSWORD,
  });
  return authService;
}
