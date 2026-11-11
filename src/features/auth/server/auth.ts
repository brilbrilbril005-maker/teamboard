import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";
import * as schema from "@/db/schema";
import type { Database } from "@/db/types";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_PATTERN,
} from "../model";

const SECONDS_IN_DAY = 60 * 60 * 24;
const SESSION_LIFETIME_SECONDS = SECONDS_IN_DAY * 7;
const SESSION_REFRESH_AFTER_SECONDS = SECONDS_IN_DAY;

/** Префикс cookie сессии. Его же использует proxy.ts для быстрой проверки. */
export const AUTH_COOKIE_PREFIX = "teamboard";

export type AuthConfig = {
  readonly db: Database;
  readonly secret: string;
  /** Публичный адрес приложения. */
  readonly baseUrl: string;
};

/**
 * Настройка Better Auth. HTTP-адреса библиотеки наружу не публикуются:
 * вход и регистрация идут только через наши серверные действия, поэтому
 * обойти правила логина или ограничитель попыток нельзя.
 */
export function createAuth(config: AuthConfig) {
  return betterAuth({
    appName: "Teamboard",
    baseURL: config.baseUrl,
    secret: config.secret,
    database: drizzleAdapter(config.db, { provider: "pg", usePlural: true, schema }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: PASSWORD_MIN_LENGTH,
      maxPasswordLength: PASSWORD_MAX_LENGTH,
    },
    session: {
      expiresIn: SESSION_LIFETIME_SECONDS,
      updateAge: SESSION_REFRESH_AFTER_SECONDS,
    },
    advanced: {
      cookiePrefix: AUTH_COOKIE_PREFIX,
      useSecureCookies: config.baseUrl.startsWith("https://"),
      database: { generateId: "uuid" },
    },
    // Никаких обращений к внешним сервисам.
    telemetry: { enabled: false },
    plugins: [
      username({
        minUsernameLength: USERNAME_MIN_LENGTH,
        maxUsernameLength: USERNAME_MAX_LENGTH,
        usernameValidator: (value) => USERNAME_PATTERN.test(value),
        displayUsername: false,
      }),
      // Должен быть последним: записывает cookie сессии в ответ Next.js.
      nextCookies(),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
